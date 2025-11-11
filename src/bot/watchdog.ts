import * as dsc from 'discord.js';
import { cfg } from './cfg.js';
import { PredefinedColors } from '@/util/color.js';
import { client } from '@/client.js';
import {output as debug, ft} from '@/bot/logging.js';
import { Action, ChannelEventCtx, MessageEventCtx, Ok, PredefinedActionEventTypes, UserEventCtx } from '@/features/actions/index.js';
import { getChannel } from '@/features/actions/channels/templateChannels.js';
import sleep from '@/util/sleep.js';
import { OnWarnGiven, WarnEventCtx } from '@/events/actions/warnEvents.js';
import { CommandMessageAPI, CommandPermissionResolvable } from './command.js';

const recentJoins: { id: string; joinedAt: number; username: string }[] = [];
const recentWarns: { id: string; givenAt: number; givenTo: dsc.Snowflake; givenFrom: dsc.Snowflake }[] = [];

function levenshtein(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            matrix[i][j] =
                b[i - 1] === a[j - 1]
                    ? matrix[i - 1][j - 1]
                    : Math.min(
                          matrix[i - 1][j - 1] + 1,
                          matrix[i][j - 1] + 1,
                          matrix[i - 1][j] + 1
                      );
        }
    }
    return matrix[b.length][a.length];
}

async function logAlarming(description: string, fatal: boolean, mem: dsc.GuildMember, score: number) {
    const channel = await client.channels.fetch(cfg.channels.mod.eclairBotAlerts);
    if (!channel?.isSendable()) return;
    channel.send({
        embeds: [
            new dsc.EmbedBuilder()
                .setAuthor({
                    name: 'EclairBOT'
                })
                .setColor(fatal ? PredefinedColors.Red : PredefinedColors.Yellow)
                .setTitle('❌ ' + (fatal ? `Podejmij działania na temat użytkownika ${mem.user.username}!` : `${mem.user.username} może być podejrzany.`))
                .setDescription(`Nastąpiły te problemy z tym użytkownikiem:\n\n${description}\n\nWyliczyłem i ma ${score} punktów reputacji. ${fatal ? `A i sorry za ping...` : 'A! Co prawda nie spingowałem, ale sorki za mały flood.'}`)
        ],
        content: fatal ? '@here' : undefined
    });
}

export async function watchNewMember(mem: dsc.GuildMember): Promise<boolean | 'kicked'> {
    let defaultTrustScore = 5;
    let trustScore = (defaultTrustScore - 1) + 1; // javascript i dont want references

    let fatal = false;
    let issues: string[] = [];

    if (cfg.masterSecurity.trustNewMembers) return true;
    if (cfg.masterSecurity.fuckNewMembers) {
        await mem.kick();
        return 'kicked';
    }
    if (cfg.masterSecurity.fuckNewMembersLight) {
        await mem.roles.add('1415020555572088872');
        const chan = await getChannel(cfg.channels.isolation.isolationCell, client);
        for (let integer = 0; integer < 3; integer++) {
            if (!chan?.isSendable()) {
                break;
            }
            await sleep(15_000);
            await chan.send(`<@${mem.user.id}> włączone są zabezpiecznia, bo jest raid czy coś, więc przenieśliśmy cię do izolatki. jak udowodnisz że nie jesteś altem to cie wypuścimy z izolatki... (ten ping odbędzie się jeszcze ${3 - (integer + 1)} razy, ponieważ nie masz uprawnień do czytania historii wiadomości)`);
        }
        return false;
    }
    if (!cfg.masterSecurity.allowNewBots && mem.user.bot) {
        const notifyChan = await client.channels.fetch(cfg.channels.mod.eclairBotAlerts);
        if (notifyChan && notifyChan.isSendable()) {
            await notifyChan.send('dodawanie botów jest wyłączone w konfiguracji')
            await notifyChan.send('aby dodać innego bota, włącz cfg.masterSecurity.allowNewBots');
            if (mem.user.id == '572906387382861835') await notifyChan.send('a i btw to jest zacznijTO więc i tak bym go wywalił bo jest gejem');
        } else {
            debug.warn('New bot joined, but cannot find the channel to notify everyone about it.');
        }
        await mem.kick('zasada cfg.masterSecurity.allowNewBots nie pozwala na dodawanie nowych botów');
        return 'kicked';
    }

    const created = mem.user.createdAt;
    const now = new Date();
    const accountAge = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    if (accountAge < 30) {
        issues.push('Konto jest dziwnie młode (młodsze niż miesiąc).');
        trustScore -= 2;
    }
    if (accountAge < 7) {
        issues.push('Konto jest naprawdę świeże (młodsze niż tydzień).');
        trustScore -= 5;
    }

    if (!mem.user.avatar) {
        trustScore -= 1;
        issues.push('Konto nie ma avatara (ciekawe).');
    }

    const susWords = ["free nitro", "discord.gg", "http://", "https://", ".ru", "▒", "░"];
    if (susWords.some(w => (mem.user.username.toLowerCase().includes(w)) || mem.user.displayName.toLowerCase().includes(w))) {
        trustScore -= 1;
        issues.push('Ma jakiś nick z adresem url, losowymi znakami unicode, invite do serwera, reklamą na Discord Nitro i/lub ruską domeną.');
    }

    if (mem.user.id == '572906387382861835') {
        trustScore -= 3;
        issues.push('Nikt go tu nie chce, wywalać StartIT w tej chwili!');
    }

    recentJoins.push({ id: mem.id, joinedAt: Date.now(), username: mem.user.username });
    const windowStart = Date.now() - cfg.masterSecurity.massJoinWindow;
    const recent = recentJoins.filter(e => e.joinedAt > windowStart);
    if (recent.length >= cfg.masterSecurity.massJoinThreshold) {
        issues.push(`Wykryto masowe dołączenia nowych członków - ${recent.length} w bliskim do siebie czasie.`);
        trustScore -= 3;
    }

    for (const prev of recent.filter(e => e.id !== mem.id)) {
        if (levenshtein(prev.username.toLowerCase(), mem.user.username.toLowerCase()) <= cfg.masterSecurity.similarityThreshold) {
            issues.push(`Nick podobny do innego niedawnego użytkownika: ${prev.username}`);
            trustScore -= 2;
        }
    }

    if (defaultTrustScore > trustScore) {
        if (trustScore <= 0) {
            fatal = true;
        }
        issues.push('Ma trust score mniejszy od domyślnego.');

        let issuesString = '';
        issues.forEach((issue) => {
            issuesString += `- ${issue}\n`;
        });
        issuesString = issuesString.trim();
        await logAlarming(issuesString, fatal, mem, trustScore);
        return false;
    }

    return true;
}

const roleHierarchy: dsc.Snowflake[] = [cfg.roles.secondLevelOwner, cfg.roles.headAdmin, cfg.roles.admin, cfg.roles.headMod, cfg.roles.mod, cfg.roles.helper];
const userCounters = new Map<string, { creates: number; deletes: number; warns: number; mutes: number; timeout?: NodeJS.Timeout }>();

async function downgradeRole(member: dsc.GuildMember) {
    debug.log(`watchdog: about to degrade role for ${member.user.username} (user id: ${member.id}); remove all adm roles for user: ${cfg.masterSecurity.notForgiveAdministration}`);
    if (cfg.masterSecurity.notForgiveAdministration) {
        for (const admRoleId of roleHierarchy) {
            if (member.roles.cache.has(admRoleId)) {
                try {
                    member.roles.remove(admRoleId);
                } catch {}
            }
        }
        debug.log(`watchdog: kicked ${member.user.username} from the administration`);
    } else {
        const memberRoles = member.roles.cache;
        const highestRoleId = roleHierarchy.find(rid => memberRoles.has(rid));
        if (!highestRoleId) return;
        const currentIndex = roleHierarchy.indexOf(highestRoleId);
        if (currentIndex === roleHierarchy.length - 1) return; 
        const newRoleId = roleHierarchy[currentIndex + 1];
        await member.roles.remove(highestRoleId, 'watchdog');
        await member.roles.add(newRoleId, 'watchdog');
        debug.log(`watchdog: degraded ${member.user.username} from ${highestRoleId} to ${newRoleId}`);
    }
}

function addAction(userId: string, type: "create" | "delete" | "warn" | "mute") {
    let counter = userCounters.get(userId);
    if (!counter) {
        counter = { creates: 0, deletes: 0, warns: 0, mutes: 0 };
        counter.timeout = setTimeout(() => userCounters.delete(userId), 60_000);
        userCounters.set(userId, counter);
    }

    if (type === "create") counter.creates++;
    if (type === "delete") counter.deletes++;
    if (type === "warn") counter.warns++;
    if (type === "mute") counter.mutes++;

    return counter.creates > cfg.masterSecurity.limitsConfiguration.maxChannelCreations || counter.deletes > cfg.masterSecurity.limitsConfiguration.maxChannelDeletions || counter.warns > cfg.masterSecurity.limitsConfiguration.maxWarns || counter.mutes > cfg.masterSecurity.limitsConfiguration.maxMutes;
}

const channelAddWatcher: Action<any> = {
    activationEventType: PredefinedActionEventTypes.OnChannelCreate,
    constraints: [
        () => {
            return cfg.masterSecurity.shallAutoDegrade;
        }
    ],
    callbacks: [
        async (ctx) => {
            debug.log(`watchdog: channel created`);

            const logs = await ctx.guild!.fetchAuditLogs({ type: dsc.AuditLogEvent.ChannelCreate, limit: 1 });
            const entry = logs.entries.first();
            if (!entry?.executor) return;

            const member = await ctx.guild!.members.fetch(entry.executor.id);
            if (addAction(member.id, "create")) {
                debug.log(`watchdog: about to downgrade role for ${member.user.username} [adding too many channels per minute]`);
                await downgradeRole(member);
            }
            return;
        }
    ]
};

const channelDeleteWatcher: Action<any> = {
    activationEventType: PredefinedActionEventTypes.OnChannelDelete,
    constraints: [
        () => {
            return cfg.masterSecurity.shallAutoDegrade;
        }
    ],
    callbacks: [
        async (ctx) => {
            debug.log(`watchdog: channel deleted`);

            const logs = await ctx.guild!.fetchAuditLogs({ type: dsc.AuditLogEvent.ChannelDelete, limit: 1 });
            const entry = logs.entries.first();
            if (!entry?.executor) return;

            const member = await ctx.guild!.members.fetch(entry.executor.id);
            if (addAction(member.id, "delete")) {
                debug.log(`watchdog: about to downgrade role for ${member.user.username} [deleting too many channels per minute]`);
                await downgradeRole(member);
            }
            return;
        }
    ]
};

const onWarnGivenWatcher: Action<WarnEventCtx> = {
    activationEventType: OnWarnGiven,
    constraints: [
        () => {
            return cfg.masterSecurity.shallAutoDegrade;
        }
    ],
    callbacks: [
        async (ctx) => {
            debug.log('watchdog: warn given');
            if (!ctx.moderator) {
                return;
            };
            const member = await client.guilds.cache.first()?.members.fetch(ctx.moderator);
            if (!member) return;
            if (addAction(ctx.moderator, "warn")) {
                debug.log(`watchdog: about to downgrade role for ${member.user.username} [warning too many times per minute]`);
                await downgradeRole(member);
            }
        }
    ]
};

const onMuteGivenWatcher: Action<UserEventCtx> = {
    activationEventType: PredefinedActionEventTypes.OnUserMute,
    constraints: [
        () => {
            return cfg.masterSecurity.shallAutoDegrade;
        }
    ],
    callbacks: [
        async (ctx) => {
            debug.log('watchdog: mute given');
            if (ctx.user.id == ctx.client.user.id) {
                debug.log('watchdog: ignoring mute, given by eclairbot');
                return;
            }
            if (addAction(ctx.id, "mute")) {
                debug.log(`watchdog: about to downgrade role for ${ctx.user.username} [muting too many times per minute]`);
                await downgradeRole(ctx);
            }
        }
    ]
};

export async function watchMute(executor: dsc.GuildMember) {   
    if (!cfg.masterSecurity.shallAutoDegrade) return;
    debug.log('watchdog: mute given by commmand');
    if (addAction(executor.id, "mute")) {
        debug.log(`watchdog: about to downgrade role for ${executor.user.username} [muting too many times per minute]`);
        await downgradeRole(executor);
    }
}

const dangerousPerms: dsc.PermissionsString[] = ["Administrator", "ModerateMembers", "BanMembers", "ManageChannels", "ManageGuild", "ManageMessages", "ManageRoles", "MuteMembers", "DeafenMembers", "KickMembers", "MentionEveryone", "ManageWebhooks"];

export async function watchRoleChanges(role: dsc.Role, permissionsAdded: dsc.PermissionsString[]) {
    const current = role.permissions.toArray();
    const dangerous = permissionsAdded.filter(p => dangerousPerms.includes(p));

    if (dangerous.length === 0) return;

    if (cfg.masterSecurity.approveDangerousPermissions) {
        for (const p of dangerous) {
            debug.log(`watchdog: role ${role.id} contains dangerous permission '${p}'; removing it is disabled`);
        }
        return;
    }

    const cleaned = current.filter(p => !dangerous.includes(p));

    await role.setPermissions(cleaned);

    for (const p of dangerous) {
        debug.log(`watchdog: modified role ${role.id}; removed permission '${p}'`);
    }
}

export {channelAddWatcher, channelDeleteWatcher, onWarnGivenWatcher, onMuteGivenWatcher};