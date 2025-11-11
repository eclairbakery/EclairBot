import sqlite from 'sqlite3';

import { db } from '@/bot/db.js';
import { dbRun, dbGet, dbAll } from '@/util/dbUtils.js';

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

export interface Warn {
    id: number;
    moderator_id: string;
    reason_string: string;
    points: number;
    expires_at: number | null;
};

export interface Reputation {
    id: number;
    created_at: string;
    author_id: string;
    target_user_id: string;
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
            await dbRun(`UPDATE users SET xp = xp + ? WHERE user_id = ?`, [amount, this.id]);
        },

        setXP: async (value: number) => {
            await dbRun(`UPDATE users SET xp = ? WHERE user_id = ?`, [value, this.id]);
        }
    };

    /** -------- ECONOMY -------- */
    readonly economy = {
        getBalance: async (): Promise<Balance> => {
            const row = await dbGet(
                `SELECT wallet_money, bank_money FROM users WHERE user_id = ?`,
                [this.id],
            );
            return { wallet: row?.money ?? 0, bank: row?.bank_money ?? 0 };
        },

        setBalance: async (bal: Balance) => {
            await dbRun(
                `UPDATE users
                 SET wallet_money = ?, bank_money = ?,
                 WHERE user_id = ?`,
                [bal.wallet, bal.bank, this.id],
            );
        },

        addWalletMoney: async (amount: number) => {
            return dbRun(
                `UPDATE users SET wallet_money = wallet_money + ? WHERE user_id = ?`,
                [amount, this.id],
            );
        },

        deductWalletMoney: async (amount: number) => {
            return dbRun(
                `UPDATE users SET wallet_money = wallet_money - ? WHERE user_id = ?`,
                [amount, this.id],
            );
        },

        setWalletMoney: async (value: number) => {
            return dbRun(
                `UPDATE users SET wallet_money = ? WHERE user_id = ?`,
                [value, this.id],
            );
        },

        addBankMoney: async (amount: number) => {
            return dbRun(
                `UPDATE users SET bank_money = bank_money + ? WHERE user_id = ?`,
                [amount, this.id],
            );
        },

        deductBankMoney: async (amount: number) => {
            return dbRun(
                `UPDATE users SET bank_money = bank_money - ? WHERE user_id = ?`,
                [amount, this.id],
            );
        },

        setBankMoney: async (value: number) => {
            return dbRun(
                `UPDATE users SET bank_money = ? WHERE user_id = ?`,
                [value, this.id],
            );
        },

        depositToBank: async (amount: number) => {
            await dbRun(
                `UPDATE users
                 SET money = money - ?, bank_money = bank_money + ?
                 WHERE user_id = ? AND money >= ?`,
                [amount, amount, this.id, amount]
            );
        },

        withdrawFromBank: async (amount: number) => {
            await dbRun(
                `UPDATE users
                 SET bank_money = bank_money - ?, money = money + ?
                 WHERE user_id = ? AND bank_money >= ?`,
                [amount, amount, this.id, amount]
            );
        },

        setCooldown: async (field: 'last_worked' | 'last_robbed' | 'last_slutted' | 'last_crimed', timestamp: number) => {
            await dbRun(`UPDATE users SET ${field} = ? WHERE user_id = ?`, [timestamp, this.id]);
        },

        getCooldowns: async (): Promise<Cooldowns> => {
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
            await dbRun(
                `INSERT INTO reputation (author_id, target_user_id, type, comment)
                 VALUES (?, ?, ?, ?)`,
                [this.id, targetId, type, comment ?? null]
            );
        },

        getReceived: async (): Promise<Reputation[]> => {
            return await dbAll(
                `SELECT * FROM reputation WHERE target_user_id = ? ORDER BY created_at DESC`,
                [this.id]
            );
        },

        getGiven: async (): Promise<Reputation[]> => {
            return await dbAll(
                `SELECT * FROM reputation WHERE author_id = ? ORDER BY created_at DESC`,
                [this.id]
            );
        }
    };

    /** -------- WARNS -------- */
    readonly warns = {
        add: async (moderatorId: string, reason: string, points: number, expiresAt?: number) => {
            await dbRun(
                `INSERT INTO warns (user_id, moderator_id, reason_string, points, expires_at)
                 VALUES (?, ?, ?, ?, ?)`,
                [this.id, moderatorId, reason, points, expiresAt ?? null]
            );
        },

        getAll: async (): Promise<Warn[]> => {
            return await dbAll(
                `SELECT * FROM warns WHERE user_id = ? ORDER BY id DESC`,
                [this.id]
            );
        },

        clearExpired: async () => {
            const now = Date.now();
            await dbRun(
                `DELETE FROM warns WHERE expires_at IS NOT NULL AND expires_at <= ?`,
                [now]
            );
        }
    };
}

