import * as dsc from 'discord.js';

import { db } from '@/bot/apis/db/bot-db.ts';
import { scheduleWarnDeletion } from '@/features/deleteExpiredWarns.ts';
import actionsManager from '@/features/actions/index.ts';
import { OnWarnGiven, WarnEventCtx } from '@/events/actions/warnEvents.ts';

export default async function warn(
    member: dsc.GuildMember,
    data: { reason: string; expiresAt: number | null; points: number; mod?: dsc.Snowflake },
): Promise<{ id: number }> {
    await db.ensureUserExists(member.id);

    const result = await db.runSql(
        'INSERT INTO warns (user_id, moderator_id, reason_string, points, expires_at) VALUES (?, ?, ?, ?, ?)',
        [member.id, data.mod ?? null, data.reason, data.points, data.expiresAt],
    );

    const warnId = result.lastID!;

    if (data.expiresAt) {
        scheduleWarnDeletion(warnId, data.expiresAt);
    }

    actionsManager.emit(
        OnWarnGiven,
        {
            id: warnId,
            user: member,
            moderator: data.mod,
            reason: data.reason,
            points: data.points,
            expiresAt: data.expiresAt ?? undefined,
        } satisfies WarnEventCtx,
    );

    return { id: warnId };
}
