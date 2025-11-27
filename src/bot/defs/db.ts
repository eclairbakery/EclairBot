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

