export interface UserDataRaw {
    user_id: string;
    xp: number;
    money: number;
    bank_money: number;
    last_worked: number;
    last_robbed: number;
    last_slutted: number;
    last_crimed: number;
}

export interface WarnRaw {
    id: number;
    moderator_id: string;
    reason_string: string;
    points: number;
    expires_at: number | null;
}

export interface Warn {
    id: number;
    moderatorId: string;
    reason: string;
    points: number;
    expiresAt: number | null;
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

export interface RepRaw {
    id: number;
    created_at: string;
    author_id: string;
    target_user_id: string;
    comment: string | null;
    type: '+rep' | '-rep';
}

export interface Rep {
    id: number;
    createdAt: string;
    authorId: string;
    targetUserId: string;
    comment: string | null;
    type: '+rep' | '-rep';
}

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

export interface Balance {
    wallet: number;
    bank: number;
}

export type Cooldown = number | null;

export interface Cooldowns {
    lastWorked:  Cooldown;
    lastRobbed:  Cooldown;
    lastSlutted: Cooldown;
    lastCrimed:  Cooldown;
};

