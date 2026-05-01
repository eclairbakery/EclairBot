import Money from '@/util/money.ts';

export interface UserDataRaw {
    user_id: string;
    xp: number;
    last_worked: number;
    last_robbed: number;
    last_slutted: number;
    last_crimed: number;
    last_collect_income: number;
    last_email_sent: number;
    prestige_points: number;
}

export interface EconomyRaw {
    user_id: string;
    wallet_money: bigint;
    bank_money: bigint;
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

export interface MusicEntryRaw {
    author_id: string;
    music_url: string;
}

export interface MusicEntry {
    authorId: string;
    musicUrl: string;
}

export function musicFromRaw(raw: MusicEntryRaw): MusicEntry {
    return {
        authorId: raw.author_id,
        musicUrl: raw.music_url,
    };
}

export interface Balance {
    wallet: Money;
    bank: Money;
}

export type Cooldown = number | null;

export interface Cooldowns {
    lastWorked: Cooldown;
    lastRobbed: Cooldown;
    lastSlutted: Cooldown;
    lastCrimed: Cooldown;
    lastCollectIncome: Cooldown;
    lastEmailSent: Cooldown;
}
