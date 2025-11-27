import { RepRaw, Rep, WarnRaw, Warn } from "./db.js";

export function repFromRaw(raw: RepRaw): Rep {
    return {
        id: raw.id,
        createdAt: raw.created_at,
        authorId: raw.author_id,
        targetUserId: raw.target_user_id,
        comment: raw.comment,
        type: raw.type,
    };
}

export function warnFromRaw(raw: WarnRaw): Warn {
    return {
        id: raw.id,
        moderatorId: raw.moderator_id,
        reason: raw.reason_string,
        points: raw.points,
        expiresAt: raw.expires_at,
    };
}