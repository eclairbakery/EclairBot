import * as dsc from 'discord.js';
import { db } from '../db.js';
import { cfg } from '../cfg.js';
import { PredefinedColors } from '../../util/color.js';
import { scheduleWarnDeletion } from '../../features/deleteExpiredWarns.js';

export default function kick(
    member: dsc.GuildMember,
    data: { reason: string; }
) {
    member.kick(data.reason);
}