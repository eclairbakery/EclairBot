import * as dsc from 'discord.js';

import { cfg } from './cfg.ts';
import { PredefinedColors } from '@/util/color.ts';
import { client } from '@/client.ts';
import { output } from '@/bot/logging.ts';
import { Action, PredefinedActionEventTypes, UserEventCtx } from '@/features/actions/index.ts';
import { OnWarnGiven, WarnEventCtx } from '@/events/actions/warnEvents.ts';
import { ReplyEmbed } from './apis/translations/reply-embed.ts';
import { levenshtein } from '@/util/math/levenshtein.ts';

const recentJoins: { id: string; joinedAt: number; username: string }[] = [];

async function logAlarming(description: string, fatal: boolean, mem: dsc.GuildMember, score: number) {
    const channel = await client.channels.fetch(cfg.channels.mod.eclairBotAlerts);
    if (!channel?.isSendable()) return;
    channel.send({
        embeds: [
            new ReplyEmbed()
                .setAuthor({
                    name: 'EclairBOT',
                })
                .setColor(fatal ? PredefinedColors.Red : PredefinedColors.Yellow)
                .setTitle(
                    '❌ ' + (fatal ? 'Podejmij działania na temat użytkownika <user>!'.replaceAll('<user>', mem.user.username) : `<user> może być podejrzany.`.replaceAll('<user>', mem.user.username)),
                )
                .setDescription(
                    `Nastąpiły te problemy z tym użytkownikiem:\n\n${description}${'\n\nWyliczyłem i ma <score> punktów reputacji.'.replaceAll('<score>', score.toString())} A! Co prawda nie spingowałem, ale sorki za mały flood.`,
                ),
        ],
    });
}

export async function watchNewMember(mem: dsc.GuildMember): Promise<boolean | 'kicked'> {
    const defaultTrustScore = 5;
    let trustScore = defaultTrustScore;

    let fatal = false;
    const issues: string[] = [];

    if (cfg.features.watchdog.trustNewMembers) return true;
    if (cfg.features.watchdog.kickNewMembers) {
        await mem.kick();
        return 'kicked';
    }
    if (!cfg.features.watchdog.allowNewBots && mem.user.bot) {
        const notifyChan = await client.channels.fetch(cfg.channels.mod.eclairBotAlerts);
        if (notifyChan && notifyChan.isSendable()) {
            await notifyChan.send('dodawanie botów jest wyłączone w konfiguracji');
            await notifyChan.send('aby dodać innego bota, włącz cfg.features.watchdog.allowNewBots');
            if (mem.user.id == '572906387382861835') await notifyChan.send('a i btw to jest zacznijTO więc i tak bym go wywalił bo jest gejem');
        } else {
            output.warn('New bot joined, but cannot find the channel to notify everyone about it.');
        }
        await mem.kick('zasada cfg.features.watchdog.allowNewBots nie pozwala na dodawanie nowych botów');
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

    const susWords = ['free nitro', 'discord.gg', 'http://', 'https://', '.ru', '▒', '░'];
    if (susWords.some((w) => (mem.user.username.toLowerCase().includes(w)) || mem.user.displayName.toLowerCase().includes(w))) {
        trustScore -= 1;
        issues.push('Ma jakiś nick z adresem url, losowymi znakami unicode, invite do serwera, reklamą na Discord Nitro i/lub ruską domeną.');
    }

    if (mem.user.id == '572906387382861835') {
        trustScore -= 3;
        issues.push('Nikt go tu nie chce, wywalać StartIT w tej chwili!');
    }

    recentJoins.push({ id: mem.id, joinedAt: Date.now(), username: mem.user.username });
    const windowStart = Date.now() - cfg.features.watchdog.massJoinWindow;
    const recent = recentJoins.filter((e) => e.joinedAt > windowStart);
    if (recent.length >= cfg.features.watchdog.massJoinThreshold) {
        issues.push(`Wykryto masowe dołączenia nowych członków - <count> w bliskim do siebie czasie.`.replaceAll('<count>', recent.length.toString()));
        trustScore -= 3;
    }

    for (const prev of recent.filter((e) => e.id !== mem.id)) {
        if (levenshtein(prev.username.toLowerCase(), mem.user.username.toLowerCase()) <= cfg.features.watchdog.similarityThreshold) {
            issues.push(`Nick podobny do innego niedawnego użytkownika: <user>`.replaceAll('<user>', prev.username));
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

const roleHierarchy: dsc.Snowflake[] = [cfg.hierarchy.administration.headAdmin, cfg.hierarchy.administration.admin, cfg.hierarchy.administration.headMod, cfg.hierarchy.administration.mod, cfg.hierarchy.administration.helper];
const userCounters = new Map<string, { creates: number; deletes: number; warns: number; mutes: number; timeout?: number }>();

async function downgradeRole(member: dsc.GuildMember) {
    output.log(`Watchdog: About to degrade role for ${member.user.username} (user id: ${member.id}); remove all adm roles for user: ${cfg.features.watchdog.notForgiveAdministration}`);
    if (cfg.features.watchdog.notForgiveAdministration) {
        for (const admRoleId of roleHierarchy) {
            if (member.roles.cache.has(admRoleId)) {
                try {
                    member.roles.remove(admRoleId);
                } catch {}
            }
        }
        output.log(`Watchdog: Kicked ${member.user.username} from the administration`);
    } else {
        const memberRoles = member.roles.cache;
        const highestRoleId = roleHierarchy.find((rid) => memberRoles.has(rid));
        if (!highestRoleId) return;
        const currentIndex = roleHierarchy.indexOf(highestRoleId);
        if (currentIndex === roleHierarchy.length - 1) return;
        const newRoleId = roleHierarchy[currentIndex + 1];
        await member.roles.remove(highestRoleId, 'watchdog');
        await member.roles.add(newRoleId, 'watchdog');
        output.log(`Watchdog: Degraded ${member.user.username} from ${highestRoleId} to ${newRoleId}`);
    }
}

function addAction(userId: string, type: 'create' | 'delete' | 'warn' | 'mute') {
    let counter = userCounters.get(userId);
    if (!counter) {
        counter = { creates: 0, deletes: 0, warns: 0, mutes: 0 };
        counter.timeout = setTimeout(() => userCounters.delete(userId), 60_000);
        userCounters.set(userId, counter);
    }

    if (type === 'create') counter.creates++;
    if (type === 'delete') counter.deletes++;
    if (type === 'warn') counter.warns++;
    if (type === 'mute') counter.mutes++;

    return counter.creates > cfg.features.watchdog.limitsConfiguration.maxChannelCreations || counter.deletes > cfg.features.watchdog.limitsConfiguration.maxChannelDeletions || counter.warns > cfg.features.watchdog.limitsConfiguration.maxWarns || counter.mutes > cfg.features.watchdog.limitsConfiguration.maxMutes;
}

const channelAddWatcher: Action<{ guild: dsc.Guild }> = {
    activationEventType: PredefinedActionEventTypes.OnChannelCreate,
    constraints: [
        () => {
            return cfg.features.watchdog.shallAutoDegrade;
        },
    ],
    callbacks: [
        async (ctx) => {
            output.log(`Watchdog: Channel created`);

            const logs = await ctx.guild!.fetchAuditLogs({ type: dsc.AuditLogEvent.ChannelCreate, limit: 1 });
            const entry = logs.entries.first();
            if (!entry?.executor) return;

            const member = await ctx.guild!.members.fetch(entry.executor.id);
            if (addAction(member.id, 'create')) {
                output.log(`Watchdog: About to downgrade role for ${member.user.username} [adding too many channels per minute]`);
                await downgradeRole(member);
            }
            return;
        },
    ],
};

const channelDeleteWatcher: Action<{ guild: dsc.Guild }> = {
    activationEventType: PredefinedActionEventTypes.OnChannelDelete,
    constraints: [
        () => {
            return cfg.features.watchdog.shallAutoDegrade;
        },
    ],
    callbacks: [
        async (ctx) => {
            output.log(`Watchdog: Channel deleted`);

            const logs = await ctx.guild!.fetchAuditLogs({ type: dsc.AuditLogEvent.ChannelDelete, limit: 1 });
            const entry = logs.entries.first();
            if (!entry?.executor) return;

            const member = await ctx.guild!.members.fetch(entry.executor.id);
            if (addAction(member.id, 'delete')) {
                output.log(`Watchdog: About to downgrade role for ${member.user.username} [deleting too many channels per minute]`);
                await downgradeRole(member);
            }
            return;
        },
    ],
};

const onWarnGivenWatcher: Action<WarnEventCtx> = {
    activationEventType: OnWarnGiven,
    constraints: [
        () => {
            return cfg.features.watchdog.shallAutoDegrade;
        },
    ],
    callbacks: [
        async (ctx) => {
            output.log('Watchdog: Warn given');
            if (!ctx.moderator) {
                return;
            }
            const member = await client.guilds.cache.first()?.members.fetch(ctx.moderator);
            if (!member) return;
            if (addAction(ctx.moderator, 'warn')) {
                output.log(`Watchdog: About to downgrade role for ${member.user.username} [warning too many times per minute]`);
                await downgradeRole(member);
            }
        },
    ],
};

const onMuteGivenWatcher: Action<UserEventCtx> = {
    activationEventType: PredefinedActionEventTypes.OnUserMute,
    constraints: [
        () => {
            return cfg.features.watchdog.shallAutoDegrade;
        },
    ],
    callbacks: [
        async (ctx) => {
            output.log('Watchdog: Mute given');

            const logs = await ctx.guild!.fetchAuditLogs({ 
                type: dsc.AuditLogEvent.MemberUpdate, 
                limit: 5 
            });

            const entry = logs.entries.find(e => {
                if (!e.target) return false;

                if (e.target.id !== ctx.user.id) return false;

                return e.changes?.some(c => 
                    c.key === 'communication_disabled_until' && c.new
                );
            });

            if (!entry?.executor) return;

            const executor = entry.executor;

            if (executor.id === ctx.client.user.id) {
                output.log('Watchdog: Ignoring mute, given by eclairbot');
                return;
            }

            if (addAction(executor.id, 'mute')) {
                output.log(`Watchdog: About to downgrade role for ${executor.username} [muting too many times per minute]`);
                await downgradeRole(await ctx.client.guilds.cache.first()!.members.fetch(executor.id));
            }
        },
    ],
};

export async function watchMute(executor: dsc.GuildMember) {
    if (!cfg.features.watchdog.shallAutoDegrade) return;
    output.log('Watchdog: Mute given by commmand');
    if (addAction(executor.id, 'mute')) {
        output.log(`Watchdog: About to downgrade role for ${executor.user.username} [muting too many times per minute]`);
        await downgradeRole(executor);
    }
}

const dangerousPerms: dsc.PermissionsString[] = ['Administrator', 'ModerateMembers', 'BanMembers', 'ManageChannels', 'ManageGuild', 'ManageMessages', 'ManageRoles', 'MuteMembers', 'DeafenMembers', 'KickMembers', 'MentionEveryone', 'ManageWebhooks'];

export async function watchRoleChanges(role: dsc.Role, permissionsAdded: dsc.PermissionsString[]) {
    const current = role.permissions.toArray();
    const dangerous = permissionsAdded.filter((p) => dangerousPerms.includes(p));

    if (dangerous.length === 0) return;

    if (cfg.features.watchdog.approveDangerousPermissions) {
        for (const p of dangerous) {
            output.log(`Watchdog: Role ${role.id} contains dangerous permission '${p}'; removing it is disabled`);
        }
        return;
    }

    const cleaned = current.filter((p) => !dangerous.includes(p));

    await role.setPermissions(cleaned);

    for (const p of dangerous) {
        output.log(`Watchdog: Modified role ${role.id}; removed permission '${p}'`);
    }
}

export function setUpWatchdog() {
    client.on('roleCreate', (newRole: dsc.Role) => {
        watchRoleChanges(newRole, newRole.permissions.toArray());
    });

    client.on('roleUpdate', (oldRole: dsc.Role, newRole: dsc.Role) => {
        watchRoleChanges(newRole, newRole.permissions.toArray().filter((p) => !oldRole.permissions.toArray().includes(p)));
    });
}

export { channelAddWatcher, channelDeleteWatcher, onMuteGivenWatcher, onWarnGivenWatcher };
