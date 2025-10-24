import * as dsc from 'discord.js';
import { cfg } from './cfg.js';
import { PredefinedColors } from '@/util/color.js';
import { client } from '@/client.js';
import {output as debug, ft} from '@/bot/logging.js';
import { Action, MessageEventCtx, Ok, PredefinedActionEventTypes } from '@/features/actions.js';

const recentJoins: { id: string; joinedAt: number; username: string }[] = [];

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
    if (!cfg.masterSecurity.allowNewBots && mem.user.bot) {
        const notifyChan = await client.channels.fetch(cfg.channels.mod.modGeneral);
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
        trustScore -= 5;
    }
    if (accountAge < 7) {
        issues.push('Konto jest naprawdę świeże (młodsze niż tydzień).');
        trustScore -= 1;
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
const userCounters = new Map<string, { creates: number; deletes: number; timeout?: NodeJS.Timeout }>();

async function downgradeRole(member: dsc.GuildMember) {
    const memberRoles = member.roles.cache;
    const highestRoleId = roleHierarchy.find(rid => memberRoles.has(rid));
    if (!highestRoleId) return;
    const currentIndex = roleHierarchy.indexOf(highestRoleId);
    if (currentIndex === roleHierarchy.length - 1) return; 
    const newRoleId = roleHierarchy[currentIndex + 1];
    await member.roles.remove(highestRoleId);
    await member.roles.add(newRoleId);
    debug.log(`watchdog: degraded ${member.user.username} from ${highestRoleId} to ${newRoleId}`);
}

function addAction(userId: string, type: "create" | "delete") {
    let counter = userCounters.get(userId);
    if (!counter) {
        counter = { creates: 0, deletes: 0 };
        counter.timeout = setTimeout(() => userCounters.delete(userId), 60_000);
        userCounters.set(userId, counter);
    }

    if (type === "create") counter.creates++;
    if (type === "delete") counter.deletes++;

    return counter.creates > 10 || counter.deletes > 2;
}

const channelAddWatcher: Action<MessageEventCtx> = {
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
                debug.log(`watchdog: about to downgrade role for ${member} [adding too many channels per minute]`);
                await downgradeRole(member);
            }
            return;
        }
    ]
};

const channelDeleteWatcher: Action<MessageEventCtx> = {
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
                debug.log(`watchdog: about to downgrade role for ${member} [deleting too many channels per minute]`);
                await downgradeRole(member);
            }
            return;
        }
    ]
};

export {channelAddWatcher, channelDeleteWatcher};