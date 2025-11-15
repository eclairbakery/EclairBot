import sqlite from 'sqlite3';

import { db } from '@/bot/apis/db/bot-db.js';
import { output } from '@/bot/logging.js';

import { Warn, WarnRaw, Rep, RepRaw, Balance } from './db-defs.js';
import { Cooldowns, Cooldown } from './db-defs.js';
import { repFromRaw, warnFromRaw } from './db-defs.js';

export default class User {
    readonly id: string;

    constructor(userId: string) {
        this.id = userId;
    }

    async ensureExists(): Promise<void> {
        db.runSql(
            `INSERT OR IGNORE INTO users (user_id) VALUES (?);`,
            [this.id]
        );
    }

    /** -------- LEVELING -------- */
    readonly leveling = {
        getXP: async (): Promise<number> => {
            const row = await db.selectOne(`SELECT xp FROM users WHERE user_id = ?`, [this.id]);
            return row?.xp ?? 0;
        },

        addXP: async (amount: number) => {
            await this.ensureExists();
            await db.runSql(`UPDATE users SET xp = xp + ? WHERE user_id = ?`, [amount, this.id]);
        },

        setXP: async (value: number) => {
            await this.ensureExists();
            await db.runSql(`UPDATE users SET xp = ? WHERE user_id = ?`, [value, this.id]);
        },

        getEveryoneXPWithLimit: async (limit: number): Promise<{xp: number, user_id: string}[]> => {
            await this.ensureExists();
            const rows = await db.selectMany(`SELECT xp, user_id FROM users ORDER BY xp DESC LIMIT ?`, [limit]) ?? [];
            return rows;
        },

        getEveryoneXPNoLimit: async (): Promise<{xp: number, user_id: string}[]> => {
            await this.ensureExists();
            const rows = await db.selectMany(`SELECT xp, user_id FROM users ORDER BY xp DESC`, []) ?? [];
            return rows;
        },
        
        getTotalServerXP: async (): Promise<number> => {
            const row = await db.selectOne(`SELECT SUM(xp) AS totalXP FROM users`);
            return row?.totalXP ?? 0;
        },
    };

    /** -------- ECONOMY -------- */
    readonly economy = {
        getBalance: async (): Promise<Balance> => {
            await this.ensureExists();
            const row = await db.selectOne<{ wallet_money: number; bank_money: number }>(
                `SELECT wallet_money, bank_money FROM users WHERE user_id = ?`,
                [this.id],
            );
            let result = { wallet: row?.wallet_money ?? 0, bank: row?.bank_money ?? 0 };
            return result;
        },

        setBalance: async (bal: Balance) => {
            await this.ensureExists();
            await db.runSql(
                `UPDATE users
                 SET wallet_money = ?, bank_money = ?
                 WHERE user_id = ?`,
                [bal.wallet, bal.bank, this.id],
            );
        },

        addWalletMoney: async (amount: number) => {
            await this.ensureExists();
            return db.runSql(
                `UPDATE users SET wallet_money = wallet_money + ? WHERE user_id = ?`,
                [amount, this.id],
            );
        },

        deductWalletMoney: async (amount: number) => {
            await this.ensureExists();
            return db.runSql(
                `UPDATE users SET wallet_money = wallet_money - ? WHERE user_id = ?`,
                [amount, this.id],
            );
        },

        setWalletMoney: async (value: number) => {
            await this.ensureExists();
            return db.runSql(
                `UPDATE users SET wallet_money = ? WHERE user_id = ?`,
                [value, this.id],
            );
        },

        addBankMoney: async (amount: number) => {
            await this.ensureExists();
            return db.runSql(
                `UPDATE users SET bank_money = bank_money + ? WHERE user_id = ?`,
                [amount, this.id],
            );
        },

        deductBankMoney: async (amount: number) => {
            await this.ensureExists();
            return db.runSql(
                `UPDATE users SET bank_money = bank_money - ? WHERE user_id = ?`,
                [amount, this.id],
            );
        },

        setBankMoney: async (value: number) => {
            await this.ensureExists();
            return db.runSql(
                `UPDATE users SET bank_money = ? WHERE user_id = ?`,
                [value, this.id],
            );
        },

        depositToBank: async (amount: number) => {
            await this.ensureExists();
            await db.runSql(
                `UPDATE users
                 SET wallet_money = wallet_money - ?, bank_money = bank_money + ?
                 WHERE user_id = ? AND wallet_money >= ?`,
                [amount, amount, this.id, amount]
            );
        },

        withdrawFromBank: async (amount: number) => {
            await this.ensureExists();
            await db.runSql(
                `UPDATE users
                 SET bank_money = bank_money - ?, wallet_money = wallet_money + ?
                 WHERE user_id = ? AND bank_money >= ?`,
                [amount, amount, this.id, amount]
            );
        },

        setCooldown: async (field: 'last_worked' | 'last_robbed' | 'last_slutted' | 'last_crimed', timestamp: number) => {
            await this.ensureExists();
            await db.runSql(`UPDATE users SET ${field} = ? WHERE user_id = ?`, [timestamp, this.id]);
        },

        getCooldowns: async (): Promise<Cooldowns> => {
            await this.ensureExists();
            const row = await db.selectOne(
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
        },
    };

    /** -------- REPUTATION -------- */
    readonly reputation = {
        give: async (targetId: string, type: '+rep' | '-rep', comment?: string) => {
            return db.runSql(
                `INSERT INTO reputation (author_id, target_user_id, type, comment)
                 VALUES (?, ?, ?, ?)`,
                [this.id, targetId, type, comment ?? null]
            );
        },

        getReceived: async (): Promise<Rep[]> => {
            const rawReps = await db.selectMany<RepRaw>(
                `SELECT * FROM reputation WHERE target_user_id = ? ORDER BY created_at DESC`,
                [this.id]
            );
            return rawReps.map(repFromRaw);
        },

        getGiven: async (): Promise<Rep[]> => {
            const rawReps = await db.selectMany<RepRaw>(
                `SELECT * FROM reputation WHERE author_id = ? ORDER BY created_at DESC`,
                [this.id]
            );
            return rawReps.map(repFromRaw);
        },
    };

    /** -------- WARNS -------- */
    readonly warns = {
        add: async ({ moderatorId, reason, points, expiresAt }: Warn) => {
            return db.runSql(
                `INSERT INTO warns (user_id, moderator_id, reason_string, points, expires_at)
                 VALUES (?, ?, ?, ?, ?)`,
                [this.id, moderatorId, reason, points, expiresAt ?? null]
            );
        },

        getAll: async (): Promise<Warn[]> => {
            const rawWarns = await db.selectMany<WarnRaw>(
                `SELECT * FROM warns WHERE user_id = ? ORDER BY id DESC`,
                [this.id]
            );
            return rawWarns.map(warnFromRaw);
        },

        clearExpired: async () => {
            const now = Date.now();
            return db.runSql(
                `DELETE FROM warns WHERE expires_at IS NOT NULL AND expires_at <= ?`,
                [now]
            );
        },
    };
}
