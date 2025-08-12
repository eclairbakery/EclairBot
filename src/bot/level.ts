import * as dsc from 'discord.js';
import * as log from '../util/log.js';
import { cfg } from '../bot/cfg.js';
import { db } from '../bot/db.js';

export const lvlRoles = [
    "1297559525989158912",
    "1235550102563852348",
    "1235550105751392276",
    "1235550109891035218",
    "1235570092218122251",
    "1235594078305914880",
    "1235594081556627577",
    "1235594083544858667",
    "1235594085188767835",
    "1390802440739356762"
];

function calculateLevel(xp: number, level_divider: number): number {
    return Math.floor(
        (1 + Math.sqrt(1 + 8 * xp / cfg.general.leveling.level_divider)) / 2
    );
}

export function addExperiencePoints(msg: dsc.OmitPartialGroupDMChannel<dsc.Message<boolean>>) {
    // check if eligible
    if (cfg.general.leveling.excludedChannels.includes(msg.channelId)) return;

    // amount
    let amount = cfg.general.leveling.xp_per_message;
    if (msg.attachments.size > 0 && msg.content.length > 5) amount = Math.floor(amount * 1.5);
    if (msg.content.length > 100) amount = Math.floor(amount);

    // checkpoints
    // Fetch current XP from the database
    db.get(
        `SELECT xp FROM leveling WHERE user_id = ?`,
        [msg.author.id],
        (err, row: any) => {
            if (err) {
                log.replyError(msg, 'Błąd', err.message);
                return;
            }

            const prevXp = row ? row.xp : 0;
            const newXp = prevXp + amount;

            const prevLevel = calculateLevel(prevXp, cfg.general.leveling.level_divider);
            const newLevel = calculateLevel(newXp, cfg.general.leveling.level_divider);

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
                        member.roles.add(milestoneRoleId).catch((e: any) => {
                            log.replyError(msg, `Błąd`, e.message ?? e);
                        });
                    }
                }
            }
        }
    );
}
