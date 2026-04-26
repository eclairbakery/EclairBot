import * as dsc from 'discord.js';

import User from './apis/db/user.ts';

import { cfg } from '@/bot/cfg.ts';
import actionsManager, { Action } from '@/features/actions/index.ts';
import { client } from '@/client.ts';
import { mkProgressBar } from '@/util/progressbar.ts';
import { output } from './logging.ts';
import { findLowerClosestKey } from '@/util/objects/findLowerClosestKey.ts';

export const OnSetXpEvent = actionsManager.mkEvent('OnSetXpEvent');
export interface XpEventCtx {
    userID: dsc.Snowflake;
    user?: dsc.GuildMember | undefined;
    guild: dsc.Guild;
    action: 'set' | 'add' | 'delete';
    amount: number;
}

export function xpToLevel(xp: number, levelDivider: number = cfg.features.leveling.levelDivider): number {
    return Math.floor(
        (1 + Math.sqrt(1 + 8 * xp / levelDivider)) / 2,
    );
}

export function levelToXp(level: number, levelDivider: number = cfg.features.leveling.levelDivider): number {
    return Math.floor((level * (level - 1) / 2) * levelDivider);
}

export const lvlRoles = Object.values(cfg.features.leveling.milestoneRoles);

function getMention(user: dsc.GuildMember) {
    return `<@${user.user.id}>`;
}

export function mkLvlProgressBar(xp: number, levelDivider: number, totalLength: number = 10): string {
    const level = xpToLevel(xp, levelDivider);
    const xpCurrentLevel = levelToXp(level, levelDivider);
    const xpNextLevel = levelToXp(level + 1, levelDivider);

    const progressXp = xp - xpCurrentLevel;
    const neededXp = xpNextLevel - xpCurrentLevel;

    return `${mkProgressBar(progressXp, neededXp, totalLength)} ${progressXp}/${neededXp}xp`;
}

export async function addLvlRole(
    guild: dsc.Guild,
    newLevel: number,
    user: dsc.Snowflake,
): Promise<boolean> {
    const milestones = cfg.features.leveling.milestoneRoles || {};
    const milestoneRoleId = milestones[findLowerClosestKey(milestones, newLevel)];
    if (!milestoneRoleId) return false;

    let roleGiven = false;

    for (const member_id of [user, ...(await (new User(user)).fetchAlternativeAccounts())]) {
        let member: dsc.GuildMember;
        try {
            member = await guild.members.fetch(member_id);
            if (member.partial) {
                member = await member.fetch(true);
            }
            if (!member.roles?.cache) {
                continue;
            }
        } catch (err) {
            output.warn(err);
            continue;
        }

        if (member.roles.cache.has(milestoneRoleId)) {
            continue;
        }

        for (const roleId of lvlRoles) {
            if (roleId !== milestoneRoleId && member.roles.cache.has(roleId)) {
                try {
                    await member.roles.remove(roleId);
                } catch (err) {
                    output.log(`Failed to remove role ${roleId}:`, err);
                }
            }
        }

        try {
            await member.roles.add(milestoneRoleId);
            roleGiven = true;
            continue;
        } catch (err) {
            output.warn(err);
            continue;
        }
    }

    return roleGiven;
}

export async function addExperiencePoints(msg: dsc.OmitPartialGroupDMChannel<dsc.Message<boolean>>) {
    // check if eligible
    if (cfg.features.leveling.excludedChannels.includes(msg.channelId)) return;

    // amount
    let amount = cfg.features.leveling.xpPerMessage;
    if (msg.attachments.size > 0 && msg.content.length > 5) amount = Math.floor(amount * 1.5);
    if (msg.content.length > 100) amount = Math.floor(amount * 1.2);

    // events
    if (cfg.features.leveling.currentEvent.enabled && cfg.features.leveling.currentEvent.channels.includes(msg.channelId)) {
        amount = Math.floor(amount * cfg.features.leveling.currentEvent.multiplier);
    }

    // logic
    const user = new User(msg.author.id);

    const prevXp = await user.leveling.getXP();
    const newXp = prevXp + amount;
    const prevLevel = xpToLevel(prevXp, cfg.features.leveling.levelDivider);
    const newLevel = xpToLevel(newXp, cfg.features.leveling.levelDivider);

    await user.leveling.addXP(amount);

    if (newLevel > prevLevel) {
        const gotNewRole = await addLvlRole(msg.guild!, newLevel, msg.author.id);

        const channelLvl = await msg.client.channels.fetch(cfg.features.leveling.levelChannel);
        if (!channelLvl || !channelLvl.isSendable()) return;

        let content = `${getMention(msg.member!)} wbił poziom ${newLevel}! Wow co za osiągnięcie!`;
        if (gotNewRole) content += 'I btw nową rolę zdobyłeś!';
        channelLvl.send(cfg.features.leveling.shallPingWhenNewLevel ? content : { content, allowedMentions: { parse: [] } });
    }
}

const updateXpAction: Action<XpEventCtx> = {
    name: '4fun/level',
    activatesOn: OnSetXpEvent,
    constraints: [],
    callbacks: [
        async (ctx) => {
            const user = new User(ctx.userID);
            const prevXp = await user.leveling.getXP();

            let newXp: number;
            switch (ctx.action) {
                case 'set':
                    newXp = ctx.amount;
                    break;
                case 'add':
                    newXp = prevXp + ctx.amount;
                    break;
                case 'delete':
                    newXp = Math.max(0, prevXp - ctx.amount);
                    break;
            }

            await user.leveling.setXP(newXp);

            let member: dsc.GuildMember;
            if (ctx?.user) {
                member = ctx.user;
            } else {
                member = await ctx.guild.members.fetch(ctx.userID);
                if (member == null) throw new Error();
            }

            let content: string;

            const prevLevel = xpToLevel(prevXp, cfg.features.leveling.levelDivider);
            const newLevel = xpToLevel(newXp, cfg.features.leveling.levelDivider);

            if (newLevel > prevLevel) {
                content = `Level użytkownika ${getMention(member)} został zmieniony i teraz ma aż ${newLevel} level!`;
                await addLvlRole(member.guild, newLevel, member.id);
            } else if (newLevel < prevLevel) {
                content = `Level użytkownika ${getMention(member)} został zmieniony, przez co cofnął się do levela ${newLevel}!`;
                await addLvlRole(member.guild, newLevel, member.id);
            } else {
                if (prevXp == newXp) {
                    content = `Administrator próbował zmienić level użytkownika ${getMention(member)}, ale ma autyzm i ustawił dokladnie taki sam jaki był wcześniej czyli ${prevLevel} level. Nic tylko pogratulować`;
                } else {
                    content = `Level użytkownika ${getMention(member)} został zmieniony, co prawda dalej ma ${prevLevel} level, ale tym razem ${newXp}xp zamiast ${prevXp}xp?` +
                        ` Dobra przestane yappowac tych nerdowskich liczb i dam ci progress bar do następnego levela:` +
                        '\n' + mkLvlProgressBar(newXp, levelToXp(xpToLevel(newXp) + 1));
                }
            }

            const channelLvl = await client.channels.fetch(cfg.features.leveling.levelChannel);
            if (!channelLvl || !channelLvl.isSendable()) return;
            return channelLvl.send(
                cfg.features.leveling.shallPingWhenNewLevel ? content : { content, allowedMentions: { parse: [] } },
            );
        },
    ],
};

actionsManager.addAction(updateXpAction);

export async function addVoiceExperience() {
    for (const voice_channel of client.channels.cache.filter((c) => c.isVoiceBased()).values()) {
        const channel_members = voice_channel.members;
        const channel_users: User[] = [];
        let erm = 0;

        // get erm
        for (const member of channel_members.values()) {
            const user = new User(member.id);
            const lvl = xpToLevel(await user.leveling.getXP());

            if (lvl >= cfg.features.leveling.voice.estimatedRealMembers.requiredLevel) {
                erm++;
            }
            channel_users.push(user);
        }

        if (erm < cfg.features.leveling.voice.estimatedRealMembers.requiredPeople) continue;

        // add experience
        for (const user of channel_users) {
            const xp = cfg.features.leveling.voice.xpPerMinute;

            const member = channel_members.find((cm) => cm.id == user.id)!;
            if (member.voice.selfMute || member.voice.selfDeaf) {
                continue;
            }

            await user.leveling.addXP(xp);
        }
    }

    setTimeout(addVoiceExperience, 60 * 1000);
}
