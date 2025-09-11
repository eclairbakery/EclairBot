import * as dsc from 'discord.js';
import { db } from '@/bot/db.js';
import { cfg } from '@/bot/cfg.js';
import { PredefinedColors } from '@/util/color.js';
import { scheduleWarnDeletion } from '@/features/deleteExpiredWarns.js';

export default function kick(
    member: dsc.GuildMember,
    data: { reason: string; }
): Promise<dsc.GuildMember> {
    return member.kick(data.reason);
}