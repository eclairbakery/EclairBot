import * as dsc from 'discord.js';
import { db } from '../db.js';
import { cfg } from '../cfg.js';
import { PredefinedColors } from '@/util/color.js';
import { scheduleWarnDeletion } from '@/features/deleteExpiredWarns.js';

export default function mute(
    member: dsc.GuildMember,
    data: { reason: string; duration?: number; }
): Promise<dsc.GuildMember> {
    return member.timeout(data.duration ?? null);
}