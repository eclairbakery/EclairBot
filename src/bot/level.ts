import * as dsc from 'discord.js';
import * as log from '@/util/log.js';
import { cfg } from '@/bot/cfg.js';
import { db } from '@/bot/db.js';
import actionsManager, { Action } from '@/features/actions.js';
import { dbGet, dbRun } from '@/util/db-utils.js';
import { client } from '@/client.js';
import { debug } from 'node:util';
import { mkProgressBar } from '@/util/progressbar.js';

export const OnSetXpEvent = actionsManager.mkEvent('OnSetXpEvent');
export interface XpEventCtx {
    userID: dsc.Snowflake;
    user?: dsc.GuildMember | undefined;
    guild: dsc.Guild;
    action: 'set' | 'add' | 'delete';
    amount: number;
};

export function xpToLevel(xp: number, levelDivider: number = cfg.general.leveling.levelDivider): number {
    return Math.floor(
        (1 + Math.sqrt(1 + 8 * xp / levelDivider)) / 2
    );
}

export function levelToXp(level: number, levelDivider: number = cfg.general.leveling.levelDivider): number {
    return Math.floor((level * (level - 1) / 2) * levelDivider);
}

export const lvlRoles = Object.values(cfg.general.leveling.milestoneRoles);

function getMention(user: dsc.GuildMember, ping: boolean = cfg.general.leveling.shallPingWhenNewLevel) {
    return ping ? `<@${user.user.id}>` : `**${user.displayName.replace('**', '\*\*')}**`;
}

export function mkLvlProgressBar(xp: number, xpForNextLevel: number, totalLength: number = 10): string {
    return `${mkProgressBar(xp, xpForNextLevel, totalLength)} ${xp}/${xpForNextLevel}xp`;
}

export async function addExperiencePoints(msg: dsc.OmitPartialGroupDMChannel<dsc.Message<boolean>>) {
    // check if eligible
    if (cfg.general.leveling.excludedChannels.includes(msg.channelId)) return;
    if (msg.channelId == cfg.unfilteredRelated.unfilteredChannel) return;

    // amount
    let amount = cfg.general.leveling.xpPerMessage;
    if (msg.attachments.size > 0 && msg.content.length > 5) amount = Math.floor(amount * 1.5);
    if (msg.content.length > 100) amount = Math.floor(amount);

    // checkpoints
    // Fetch current XP from the database
    db.get(
        `SELECT xp FROM leveling WHERE user_id = ?`,
        [msg.author.id],
        async (err, row: any) => {
            if (err) {
                log.replyError(msg, 'Błąd', err.message);
                return;
            }

            const prevXp = row ? row.xp : 0;
            const newXp = prevXp + amount;

            const prevLevel = xpToLevel(prevXp, cfg.general.leveling.levelDivider);
            const newLevel = xpToLevel(newXp, cfg.general.leveling.levelDivider);

            // let's insert this data
            db.run(
                `INSERT INTO leveling (user_id, xp) VALUES (?, ?)
                 ON CONFLICT(user_id) DO UPDATE SET xp = xp + excluded.xp`,
                [msg.author.id, amount]
            );

            // Check for level up
            if (newLevel > prevLevel) {
                // Check for milestone roles
                const milestones = cfg.general.leveling.milestoneRoles || {};
                const milestoneRoleId: string | null = milestones[newLevel] ?? null;
                if (milestoneRoleId != null && msg.guild) {
                    const member = msg.guild.members.cache.get(msg.author.id);
                    if (member) {
                        for (const roleId of lvlRoles) {
                            try {
                                if (member.roles.cache.has(roleId)) {
                                    await member.roles.remove(roleId);
                                }
                            } catch (err) {
                                console.error(`Failed to remove role ${roleId}:`, err);
                            }
                        }
                        try {
                            await member.roles.add(milestoneRoleId);
                        } catch (err) {
                            log.replyError(msg, `Błąd`, err.message ?? err);
                        }
                    }
                }

                // Let's ping this guy
                const channelLvl = await msg.client.channels.fetch(cfg.general.leveling.levelChannel);
                if (!channelLvl || !channelLvl.isSendable()) return;

                let content = `${getMention(msg.member)} wbił poziom ${newLevel}! Wow co za osiągnięcie!`;
                if (milestoneRoleId) content += 'I btw nową rolę zdobyłeś!';
                channelLvl.send(content);
            }
        }
    );
}

const updateXpAction: Action<XpEventCtx> = {
    activationEventType: OnSetXpEvent,
    constraints: [],
    callbacks: [
        async (ctx) => {
            const res = await dbGet('SELECT xp FROM leveling WHERE user_id = ?', [ctx.userID]);
            const prevXp = res ? res.xp : 0;

            let newXp: number;
            switch (ctx.action) {
            case 'set':    newXp = ctx.amount;                       break;
            case 'add':    newXp = prevXp + ctx.amount;              break;
            case 'delete': newXp = Math.max(0, prevXp - ctx.amount); break;
            }

            await dbRun(`
                INSERT INTO leveling (user_id, xp)
                VALUES (?, ?)
                ON CONFLICT(user_id) DO UPDATE SET xp = excluded.xp;
            `, [ctx.userID, newXp]);

            let user: dsc.GuildMember;
            if (ctx?.user) {
                user = ctx.user;
            } else {
                user = await ctx.guild.members.fetch(ctx.userID);
                if (user == null) throw new Error;
            }

            let content: string;

            const prevLevel = xpToLevel(prevXp, cfg.general.leveling.levelDivider);
            const newLevel = xpToLevel(newXp, cfg.general.leveling.levelDivider);

            if (newLevel > prevLevel) {
                content = `Level użytkownika ${getMention(user)} został zmieniony i teraz ma aż ${newLevel} level!`;
            } else if (newLevel < prevLevel) {
                content = `Level użytkownika ${getMention(user)} został zmieniony, przez co cofną się do levela ${newLevel}!`;
            } else {
                if (prevXp == newXp) {
                    content = `Administrator próbował zmienić level użytkownika ${getMention(user)}, ale ma autyzm i ustawił dokladnie taki sam jaki był wcześniej czyli ${prevLevel} level. Nic tylko pogratulować`;
                } else {
                    content = `Level użytkownika ${getMention(user)} został zmieniony, co prawda dalej ma ${prevLevel} level, ale tym razem ${newXp}xp zamiast ${prevXp}xp?`
                        + ` Dobra przestane yappowac tych nerdowskich liczb i dam ci progress bar do następnego levela:` +
                        '\n' + mkLvlProgressBar(newXp, levelToXp(xpToLevel(newXp) + 1));
                }
            }

            const channelLvl = await client.channels.fetch(cfg.general.leveling.levelChannel);
            if (!channelLvl || !channelLvl.isSendable()) return;
            return channelLvl.send(content);
        },
    ],
};

actionsManager.addAction(updateXpAction);
