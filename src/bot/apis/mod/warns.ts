import * as dsc from 'discord.js';
import { db } from '@/bot/db.js';
import { cfg } from '@/bot/cfg.js';
import { PredefinedColors } from '@/util/color.js';
import { scheduleWarnDeletion } from '@/features/deleteExpiredWarns.js';
import actionsManager from '@/features/actions/index.js';
import { OnWarnGiven, WarnEventCtx } from '@/events/actions/warnEvents.js';

export default function warn(
    member: dsc.GuildMember,
    data: { reason: string; expiresAt: number | null; points: number; mod?: dsc.Snowflake; }
): Promise<{ id: number }> {
    return new Promise((resolve, reject) => {
        db.run(
            'INSERT INTO warns (user_id, moderator_id, reason_string, points, expires_at) VALUES (?, ?, ?, ?, ?)',
            [member.id, data.mod ?? null, data.reason, data.points, data.expiresAt],
            function (err) {
                if (err) {
                    reject(err);
                    return;
                }

                const warnId = this.lastID;

                if (data.expiresAt) {
                    scheduleWarnDeletion(warnId, data.expiresAt);
                }

                actionsManager.emit(OnWarnGiven, {
                    id: warnId,
                    user: member,
                    moderator: data.mod,
                    reason: data.reason,
                    points: data.points,
                    expiresAt: data.expiresAt ?? undefined
                } satisfies WarnEventCtx);

                resolve({ id: warnId });
            }
        );
    });
}