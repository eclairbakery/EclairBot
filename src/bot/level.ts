import * as dsc from 'discord.js';
import * as log from '../util/log';
import { cfg } from '../bot/cfg';
import { db } from '../bot/db';

export function addExperiencePoints(msg: dsc.OmitPartialGroupDMChannel<dsc.Message<boolean>>) {
    // check if eligible
    if (cfg.general.leveling.excludedChannels.includes(msg.channelId)) return;

    // amount
    let amount = cfg.general.leveling.xp_per_message;
    if (msg.attachments.size > 0 && msg.content.length > 5) amount = Math.floor(amount * 1.5);
    if (msg.content.length > 100) amount = Math.floor(amount);

    // let's insert this data
    db.run(
        `INSERT INTO users (user_id, xp) VALUES (?, ?)
         ON CONFLICT(user_id) DO UPDATE SET xp = xp + excluded.xp`,
        [msg.author.id, amount]
    );
}