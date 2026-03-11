import * as dsc from 'discord.js';

import { cfg } from './cfg.js';
import { PredefinedColors } from '@/util/color.js';
import { client } from '@/client.js';
import { output } from '@/bot/logging.js';
import { Action, PredefinedActionEventTypes, UserEventCtx } from '@/features/actions/index.js';
import { OnWarnGiven, WarnEventCtx } from '@/events/actions/warnEvents.js';
import { ReplyEmbed } from './apis/translations/reply-embed.js';
import { levenshtein } from '@/util/math/levenshtein.js';

const recentJoins: { id: string; joinedAt: number; username: string }[] = [];

async function logAlarming(description: string, fatal: boolean, mem: dsc.GuildMember, score: number) {
    const channel = await client.channels.fetch(cfg.legacy.channels.mod.eclairBotAlerts);
    if (!channel?.isSendable()) return;
    channel.send({
        embeds: [
            new ReplyEmbed()
                .setAuthor({
                    name: 'EclairBOT'
                })
                .setColor(fatal ? PredefinedColors.Red : PredefinedColors.Yellow)
                .setTitle('❌ ' + (fatal ? cfg.legacy.customization.watchdogTexts.fatalHeader.replaceAll('<user>', mem.user.username) : cfg.legacy.customization.watchdogTexts.suspiciousHeader.replaceAll('<user>', mem.user.username)))
                .setDescription(`${cfg.legacy.customization.watchdogTexts.descStart}${description}${cfg.legacy.customization.watchdogTexts.descEnd.reputation.replaceAll('<score>', score.toString())} ${fatal ? cfg.legacy.customization.watchdogTexts.descEnd.pingSorry : cfg.legacy.customization.watchdogTexts.descEnd.floodSorry}`)
        ]
    });
}

export async function watchNewMember(mem: dsc.GuildMember): Promise<boolean | 'kicked'> {
    let defaultTrustScore = 5;
    let trustScore = defaultTrustScore;

    let fatal = false;
    let issues: string[] = [];

    if (cfg.legacy.masterSecurity.trustNewMembers) return true;
    if (cfg.legacy.masterSecurity.fuckNewMembers) {
        await mem.kick();
        return 'kicked';
    }
    if (!cfg.legacy.masterSecurity.allowNewBots && mem.user.bot) {
        const notifyChan = await client.channels.fetch(cfg.legacy.channels.mod.eclairBotAlerts);
        if (notifyChan && notifyChan.isSendable()) {
            await notifyChan.send(cfg.legacy.customization.watchdogTexts.newBotsAddition.firstSentence)
            await notifyChan.send(cfg.legacy.customization.watchdogTexts.newBotsAddition.secondSentence);
            if (mem.user.id == '572906387382861835') await notifyChan.send(cfg.legacy.customization.watchdogTexts.newBotsAddition.gayBotSentence);
        } else {
            output.warn('New bot joined, but cannot find the channel to notify everyone about it.');
        }
        await mem.kick(cfg.legacy.customization.watchdogTexts.newBotsAddition.remReason);
        return 'kicked';
    }

    const created = mem.user.createdAt;
    const now = new Date();
    const accountAge = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    if (accountAge < 30) {
        issues.push(cfg.legacy.customization.watchdogTexts.susThings.youngAccount);
        trustScore -= 2;
    }
    if (accountAge < 7) {
        issues.push(cfg.legacy.customization.watchdogTexts.susThings.freshAccount);
        trustScore -= 5;
    }

    if (!mem.user.avatar) {
        trustScore -= 1;
        issues.push(cfg.legacy.customization.watchdogTexts.susThings.noAvatar);
    }

    const susWords = ["free nitro", "discord.gg", "http://", "https://", ".ru", "▒", "░"];
    if (susWords.some(w => (mem.user.username.toLowerCase().includes(w)) || mem.user.displayName.toLowerCase().includes(w))) {
        trustScore -= 1;
        issues.push(cfg.legacy.customization.watchdogTexts.susThings.susName);
    }

    if (mem.user.id == '572906387382861835') {
        trustScore -= 3;
        issues.push(cfg.legacy.customization.watchdogTexts.susThings.gayBot);
    }

    recentJoins.push({ id: mem.id, joinedAt: Date.now(), username: mem.user.username });
    const windowStart = Date.now() - cfg.legacy.masterSecurity.massJoinWindow;
    const recent = recentJoins.filter(e => e.joinedAt > windowStart);
    if (recent.length >= cfg.legacy.masterSecurity.massJoinThreshold) {
        issues.push(cfg.legacy.customization.watchdogTexts.susThings.raid.replaceAll('<count>', recent.length.toString()));
        trustScore -= 3;
    }

    for (const prev of recent.filter(e => e.id !== mem.id)) {
        if (levenshtein(prev.username.toLowerCase(), mem.user.username.toLowerCase()) <= cfg.legacy.masterSecurity.similarityThreshold) {
            issues.push(cfg.legacy.customization.watchdogTexts.susThings.similarUsername.replaceAll('<user>', prev.username));
            trustScore -= 2;
        }
    }

    if (defaultTrustScore > trustScore) {
        if (trustScore <= 0) {
            fatal = true;
        }
        issues.push(cfg.legacy.customization.watchdogTexts.susThings.defaultIssue);

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

const roleHierarchy: dsc.Snowflake[] = [cfg.legacy.roles.headAdmin, cfg.legacy.roles.admin, cfg.legacy.roles.headMod, cfg.legacy.roles.mod, cfg.legacy.roles.helper];
const userCounters = new Map<string, { creates: number; deletes: number; warns: number; mutes: number; timeout?: NodeJS.Timeout }>();

async function downgradeRole(member: dsc.GuildMember) {
    output.log(`watchdog: about to degrade role for ${member.user.username} (user id: ${member.id}); remove all adm roles for user: ${cfg.legacy.masterSecurity.notForgiveAdministration}`);
    if (cfg.legacy.masterSecurity.notForgiveAdministration) {
        for (const admRoleId of roleHierarchy) {
            if (member.roles.cache.has(admRoleId)) {
                try {
                    member.roles.remove(admRoleId);
                } catch {}
            }
        }
        output.log(`watchdog: kicked ${member.user.username} from the administration`);
    } else {
        const memberRoles = member.roles.cache;
        const highestRoleId = roleHierarchy.find(rid => memberRoles.has(rid));
        if (!highestRoleId) return;
        const currentIndex = roleHierarchy.indexOf(highestRoleId);
        if (currentIndex === roleHierarchy.length - 1) return; 
        const newRoleId = roleHierarchy[currentIndex + 1];
        await member.roles.remove(highestRoleId, 'watchdog');
        await member.roles.add(newRoleId, 'watchdog');
        output.log(`watchdog: degraded ${member.user.username} from ${highestRoleId} to ${newRoleId}`);
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

    return counter.creates > cfg.legacy.masterSecurity.limitsConfiguration.maxChannelCreations || counter.deletes > cfg.legacy.masterSecurity.limitsConfiguration.maxChannelDeletions || counter.warns > cfg.legacy.masterSecurity.limitsConfiguration.maxWarns || counter.mutes > cfg.legacy.masterSecurity.limitsConfiguration.maxMutes;
}

const channelAddWatcher: Action<any> = {
    activationEventType: PredefinedActionEventTypes.OnChannelCreate,
    constraints: [
        () => {
            return cfg.legacy.masterSecurity.shallAutoDegrade;
        }
    ],
    callbacks: [
        async (ctx) => {
            output.log(`watchdog: channel created`);

            const logs = await ctx.guild!.fetchAuditLogs({ type: dsc.AuditLogEvent.ChannelCreate, limit: 1 });
            const entry = logs.entries.first();
            if (!entry?.executor) return;

            const member = await ctx.guild!.members.fetch(entry.executor.id);
            if (addAction(member.id, "create")) {
                output.log(`watchdog: about to downgrade role for ${member.user.username} [adding too many channels per minute]`);
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
            return cfg.legacy.masterSecurity.shallAutoDegrade;
        }
    ],
    callbacks: [
        async (ctx) => {
            output.log(`watchdog: channel deleted`);

            const logs = await ctx.guild!.fetchAuditLogs({ type: dsc.AuditLogEvent.ChannelDelete, limit: 1 });
            const entry = logs.entries.first();
            if (!entry?.executor) return;

            const member = await ctx.guild!.members.fetch(entry.executor.id);
            if (addAction(member.id, "delete")) {
                output.log(`watchdog: about to downgrade role for ${member.user.username} [deleting too many channels per minute]`);
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
            return cfg.legacy.masterSecurity.shallAutoDegrade;
        }
    ],
    callbacks: [
        async (ctx) => {
            output.log('watchdog: warn given');
            if (!ctx.moderator) {
                return;
            };
            const member = await client.guilds.cache.first()?.members.fetch(ctx.moderator);
            if (!member) return;
            if (addAction(ctx.moderator, "warn")) {
                output.log(`watchdog: about to downgrade role for ${member.user.username} [warning too many times per minute]`);
                await downgradeRole(member);
            }
        }
    ]
};

const onMuteGivenWatcher: Action<UserEventCtx> = {
    activationEventType: PredefinedActionEventTypes.OnUserMute,
    constraints: [
        () => {
            return cfg.legacy.masterSecurity.shallAutoDegrade;
        }
    ],
    callbacks: [
        async (ctx) => {
            output.log('watchdog: mute given');
            if (ctx.user.id == ctx.client.user.id) {
                output.log('watchdog: ignoring mute, given by eclairbot');
                return;
            }
            if (addAction(ctx.id, "mute")) {
                output.log(`watchdog: about to downgrade role for ${ctx.user.username} [muting too many times per minute]`);
                await downgradeRole(ctx);
            }
        }
    ]
};

export async function watchMute(executor: dsc.GuildMember) {   
    if (!cfg.legacy.masterSecurity.shallAutoDegrade) return;
    output.log('watchdog: mute given by commmand');
    if (addAction(executor.id, "mute")) {
        output.log(`watchdog: about to downgrade role for ${executor.user.username} [muting too many times per minute]`);
        await downgradeRole(executor);
    }
}

const dangerousPerms: dsc.PermissionsString[] = ["Administrator", "ModerateMembers", "BanMembers", "ManageChannels", "ManageGuild", "ManageMessages", "ManageRoles", "MuteMembers", "DeafenMembers", "KickMembers", "MentionEveryone", "ManageWebhooks"];

export async function watchRoleChanges(role: dsc.Role, permissionsAdded: dsc.PermissionsString[]) {
    const current = role.permissions.toArray();
    const dangerous = permissionsAdded.filter(p => dangerousPerms.includes(p));

    if (dangerous.length === 0) return;

    if (cfg.legacy.masterSecurity.approveDangerousPermissions) {
        for (const p of dangerous) {
            output.log(`watchdog: role ${role.id} contains dangerous permission '${p}'; removing it is disabled`);
        }
        return;
    }

    const cleaned = current.filter(p => !dangerous.includes(p));

    await role.setPermissions(cleaned);

    for (const p of dangerous) {
        output.log(`watchdog: modified role ${role.id}; removed permission '${p}'`);
    }
}

export function setUpWatchdog() {
    client.on('roleCreate', (newRole: dsc.Role) => {
        watchRoleChanges(newRole, newRole.permissions.toArray());
    });
    
    client.on('roleUpdate', (oldRole: dsc.Role, newRole: dsc.Role) => {
        watchRoleChanges(newRole, newRole.permissions.toArray().filter(p => !oldRole.permissions.toArray().includes(p)));
    });
}

export {channelAddWatcher, channelDeleteWatcher, onWarnGivenWatcher, onMuteGivenWatcher};
