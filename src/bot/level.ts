import * as dsc from 'discord.js';
import * as log from '../util/log.js';
import { cfg } from '../bot/cfg.js';
import { db } from '../bot/db.js';

function calculateLevel(xp: number, levelDivider: number): number {
    return Math.floor(
        (1 + Math.sqrt(1 + 8 * xp / cfg.general.leveling.levelDivider)) / 2
    );
}

export const lvlRoles = Object.values(cfg.general.leveling.milestone_roles);

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

            const prevLevel = calculateLevel(prevXp, cfg.general.leveling.levelDivider);
            const newLevel = calculateLevel(newXp, cfg.general.leveling.levelDivider);

            // let's insert this data
            db.run(
                `INSERT INTO leveling (user_id, xp) VALUES (?, ?)
                 ON CONFLICT(user_id) DO UPDATE SET xp = xp + excluded.xp`,
                [msg.author.id, amount]
            );

            // Check for level up
            if (newLevel > prevLevel) {
                // Check for milestone roles
                const milestones = cfg.general.leveling.milestone_roles || {};
                const milestoneRoleId = milestones[newLevel];
                if (milestoneRoleId && msg.guild) {
                    const member = msg.guild.members.cache.get(msg.author.id);
                    if (member) {
                        lvlRoles.forEach((roleId) => {
                            try {
                                if (member.roles.cache.has(roleId)) member.roles.remove(roleId);
                            } catch {}
                        });
                        member.roles.add(milestoneRoleId).catch((e: any) => {
                            log.replyError(msg, `Błąd`, e.message ?? e);
                        });
                    }
                }

                // Let's ping this guy
                const channelLvl = await msg.client.channels.fetch(cfg.general.leveling.levelChannel);
                if (!channelLvl || !channelLvl.isSendable()) return;
                channelLvl.send(`${cfg.general.leveling.shallPingWhenNewLevel ? `<@${msg.author.id}>` : msg.author.username} wbił poziom ${newLevel}! Wow co za osiągnięcie!${milestoneRoleId ? ' I btw nową rolę zdobyłeś!' : ''}`);
            }
        }
    );
}
