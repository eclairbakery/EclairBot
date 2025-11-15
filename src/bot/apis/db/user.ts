import sqlite from 'sqlite3';

import { db } from '@/bot/db.js';
import { dbRun, dbGet, dbAll, dbGetAll } from '@/util/dbUtils.js';
import { output } from '@/bot/logging.js';

export interface UserData {
    user_id: string;
    xp: number;
    money: number;
    bank_money: number;
    last_worked: number;
    last_robbed: number;
    last_slutted: number;
    last_crimed: number;
}

interface WarnRaw {
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

function warnFromRaw(raw: WarnRaw): Warn {
    return {
        id: raw.id,
        moderatorId: raw.moderator_id,
        reason: raw.reason_string,
        points: raw.points,
        expiresAt: raw.expires_at,
    };
}

interface RepRaw {
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

function repFromRaw(raw: RepRaw): Rep {
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

export default class User {
    readonly id: string;

    constructor(userId: string) {
        this.id = userId;
    }

    async ensureExists(): Promise<void> {
        dbRun(
            `INSERT OR IGNORE INTO users (user_id) VALUES (?);`,
            [this.id]
        );
    }

    /** -------- LEVELING -------- */
    readonly leveling = {
        getXP: async (): Promise<number> => {
            const row = await dbGet(`SELECT xp FROM users WHERE user_id = ?`, [this.id]);
            return row?.xp ?? 0;
        },

        addXP: async (amount: number) => {
            await this.ensureExists();
            await dbRun(`UPDATE users SET xp = xp + ? WHERE user_id = ?`, [amount, this.id]);
        },

        setXP: async (value: number) => {
            await this.ensureExists();
            await dbRun(`UPDATE users SET xp = ? WHERE user_id = ?`, [value, this.id]);
        },

        getEveryoneXPWithLimit: async (limit: number): Promise<{xp: number, user_id: string}[]> => {
            await this.ensureExists();
            const rows = await dbGetAll(`SELECT xp, user_id FROM users ORDER BY xp DESC LIMIT ?`, [limit]) ?? [];
            return rows;
        },

        getEveryoneXPNoLimit: async (): Promise<{xp: number, user_id: string}[]> => {
            await this.ensureExists();
            const rows = await dbGetAll(`SELECT xp, user_id FROM users ORDER BY xp DESC`) ?? [];
            return rows;
        },
        
        getTotalServerXP: async (): Promise<number> => {
            const row = await dbGet(`SELECT SUM(xp) AS totalXP FROM users`);
            return row?.totalXP ?? 0;
        },
    };

    /** -------- ECONOMY -------- */
    readonly economy = {
        getBalance: async (): Promise<Balance> => {
            await this.ensureExists();
            const row = await dbGet(
                `SELECT * FROM users WHERE user_id = ?`,
                [this.id],
            );
            let result = { wallet: row?.wallet_money ?? 0, bank: row?.bank_money ?? 0 };
            output.log(`balance for ${this.id}: \`${JSON.stringify(result, undefined, 0)}\``);
            return result;
        },

        setBalance: async (bal: Balance) => {
            await this.ensureExists();
            await dbRun(
                `UPDATE users
                 SET wallet_money = ?, bank_money = ?
                 WHERE user_id = ?`,
                [bal.wallet, bal.bank, this.id],
            );
        },

        addWalletMoney: async (amount: number) => {
            await this.ensureExists();
            return dbRun(
                `UPDATE users SET wallet_money = wallet_money + ? WHERE user_id = ?`,
                [amount, this.id],
            );
        },

        deductWalletMoney: async (amount: number) => {
            await this.ensureExists();
            return dbRun(
                `UPDATE users SET wallet_money = wallet_money - ? WHERE user_id = ?`,
                [amount, this.id],
            );
        },

        setWalletMoney: async (value: number) => {
            await this.ensureExists();
            return dbRun(
                `UPDATE users SET wallet_money = ? WHERE user_id = ?`,
                [value, this.id],
            );
        },

        addBankMoney: async (amount: number) => {
            await this.ensureExists();
            return dbRun(
                `UPDATE users SET bank_money = bank_money + ? WHERE user_id = ?`,
                [amount, this.id],
            );
        },

        deductBankMoney: async (amount: number) => {
            await this.ensureExists();
            return dbRun(
                `UPDATE users SET bank_money = bank_money - ? WHERE user_id = ?`,
                [amount, this.id],
            );
        },

        setBankMoney: async (value: number) => {
            await this.ensureExists();
            return dbRun(
                `UPDATE users SET bank_money = ? WHERE user_id = ?`,
                [value, this.id],
            );
        },

        depositToBank: async (amount: number) => {
            await this.ensureExists();
            await dbRun(
                `UPDATE users
                 SET wallet_money = wallet_money - ?, bank_money = bank_money + ?
                 WHERE user_id = ? AND wallet_money >= ?`,
                [amount, amount, this.id, amount]
            );
        },

        withdrawFromBank: async (amount: number) => {
            await this.ensureExists();
            await dbRun(
                `UPDATE users
                 SET bank_money = bank_money - ?, wallet_money = wallet_money + ?
                 WHERE user_id = ? AND bank_money >= ?`,
                [amount, amount, this.id, amount]
            );
        },

        setCooldown: async (field: 'last_worked' | 'last_robbed' | 'last_slutted' | 'last_crimed', timestamp: number) => {
            await this.ensureExists();
            await dbRun(`UPDATE users SET ${field} = ? WHERE user_id = ?`, [timestamp, this.id]);
        },

        getCooldowns: async (): Promise<Cooldowns> => {
            await this.ensureExists();
            const row = await dbGet(
                `SELECT last_worked, last_robbed, last_slutted, last_crimed
                 FROM users WHERE user_id = ?`,
                [this.id]
            );
            if (row == null) return { lastWorked: null, lastRobbed: null, lastSlutted: null, lastCrimed: null };

            return {
                lastWorked:  row.last_worked ?? null,
                lastRobbed:  row.last_robbed ?? null,
                lastSlutted: row.last_slutted ?? null,
                lastCrimed:  row.last_crimed ?? null,
            };
        }
    };

    /** -------- REPUTATION -------- */
    readonly reputation = {
        give: async (targetId: string, type: '+rep' | '-rep', comment?: string) => {
            return dbRun(
                `INSERT INTO reputation (author_id, target_user_id, type, comment)
                 VALUES (?, ?, ?, ?)`,
                [this.id, targetId, type, comment ?? null]
            );
        },

        getReceived: async (): Promise<Rep[]> => {
            const rawReps = await dbAll<RepRaw>(
                `SELECT * FROM reputation WHERE target_user_id = ? ORDER BY created_at DESC`,
                [this.id]
            );
            return rawReps.map(repFromRaw);
        },

        getGiven: async (): Promise<Rep[]> => {
            const rawReps = await dbAll<RepRaw>(
                `SELECT * FROM reputation WHERE author_id = ? ORDER BY created_at DESC`,
                [this.id]
            );
            return rawReps.map(repFromRaw);
        }
    };

    /** -------- WARNS -------- */
    readonly warns = {
        add: async ({ moderatorId, reason, points, expiresAt }: Warn) => {
            return dbRun(
                `INSERT INTO warns (user_id, moderator_id, reason_string, points, expires_at)
                 VALUES (?, ?, ?, ?, ?)`,
                [this.id, moderatorId, reason, points, expiresAt ?? null]
            );
        },

        getAll: async (): Promise<Warn[]> => {
            const rawWarns = await dbAll<WarnRaw>(
                `SELECT * FROM warns WHERE user_id = ? ORDER BY id DESC`,
                [this.id]
            );
            return rawWarns.map(warnFromRaw);
        },

        clearExpired: async () => {
            const now = Date.now();
            return dbRun(
                `DELETE FROM warns WHERE expires_at IS NOT NULL AND expires_at <= ?`,
                [now]
            );
        }
    };
}

