import * as dsc from 'discord.js';

import { cfg } from './cfg.ts';
import { client } from '@/client.ts';
import { output } from '@/bot/logging.ts';
import { Action, PredefinedActionEventTypes, UserEventCtx } from '@/features/actions/index.ts';
import { OnWarnGiven, WarnEventCtx } from '@/events/actions/warnEvents.ts';

export async function watchNewMember(mem: dsc.GuildMember): Promise<'kicked' | void> {
    if (cfg.features.watchdog.kickNewMembers) {
        await mem.kick();
        return 'kicked';
    }
    if (!cfg.features.watchdog.allowNewBots && mem.user.bot) {
        const notifyChan = await client.channels.fetch(cfg.channels.general.general);
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
    name: 'watchdog/watchers/channel-add',
    activatesOn: PredefinedActionEventTypes.OnChannelCreate,
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
    name: 'watchdog/watchers/channel-delete',
    activatesOn: PredefinedActionEventTypes.OnChannelDelete,
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
    name: 'watchdog/watchers/user-warn',
    activatesOn: OnWarnGiven,
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
    name: 'watchdog/watchers/user-mute',
    activatesOn: PredefinedActionEventTypes.OnUserMute,
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
                limit: 5,
            });

            const entry = logs.entries.find((e) => {
                if (!e.target) return false;

                if (e.target.id !== ctx.user.id) return false;

                return e.changes?.some((c) => c.key === 'communication_disabled_until' && c.new);
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
