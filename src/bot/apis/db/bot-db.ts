import { DB } from "sqlite";

import type { UserDataRaw, Warn, WarnRaw, Rep, RepRaw } from './db-defs.js';
import type { Balance, Cooldown, Cooldowns } from './db-defs.js';
import { warnFromRaw, repFromRaw } from './db-defs.js';

export type { UserDataRaw, Warn, WarnRaw, Rep, RepRaw };
export type { Balance, Cooldown, Cooldowns };
export { warnFromRaw, repFromRaw };

import User from './user.js';

export interface DBRunResult {
    lastID: number | null;
    changes: number | null;
}

export class BotDatabase {
    protected raw: DB;

    constructor(dbPath: string) {
        this.raw = new DB(dbPath);
    }

    async init(): Promise<void> {
        await this.execSql(`
            CREATE TABLE IF NOT EXISTS users (
                user_id TEXT PRIMARY KEY,
                xp INTEGER DEFAULT 0,
                
                last_worked INTEGER DEFAULT 0,
                last_robbed INTEGER DEFAULT 0,
                last_slutted INTEGER DEFAULT 0,
                last_crimed INTEGER DEFAULT 0,
                last_collect_income INTEGER DEFAULT 0,
                last_email_sent INTEGER DEFAULT 0,
                
                signature TEXT,
                default_email_title TEXT
            );

            CREATE TABLE IF NOT EXISTS economy (
                user_id TEXT PRIMARY KEY REFERENCES users(user_id),
                wallet_money INTEGER DEFAULT 0,
                bank_money INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS warns (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL REFERENCES users(user_id),
                moderator_id TEXT NOT NULL,
                reason_string TEXT NOT NULL,
                points INTEGER NOT NULL,
                expires_at INTEGER
            );

            CREATE TABLE IF NOT EXISTS user_items (
                user_id TEXT NOT NULL REFERENCES users(user_id),
                item_id TEXT NOT NULL,
                amount INTEGER DEFAULT 0,
                PRIMARY KEY (user_id, item_id)
            );

            CREATE TABLE IF NOT EXISTS reputation (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                author_id TEXT NOT NULL REFERENCES users(user_id),
                target_user_id TEXT NOT NULL REFERENCES users(user_id),
                comment TEXT,
                type TEXT NOT NULL CHECK(type IN ('+rep', '-rep'))
            );

            CREATE TABLE IF NOT EXISTS email_security (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                enabled_domain TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS email_blacklist (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS user_purchases (
                user_id TEXT NOT NULL REFERENCES users(user_id),
                offer_id TEXT NOT NULL,
                amount INTEGER DEFAULT 0,
                PRIMARY KEY (user_id, offer_id)
            );
        `);
    }

    // ------------------ low-level helpers ------------------

    private processParams(params: any[]): any[] {
        return params.map((p) => typeof p === "bigint" ? Number(p) : p);
    }

    async runSql(sql: string, params: any[] = []): Promise<DBRunResult> {
        this.raw.query(sql, this.processParams(params));
        let lastID: number | null = null;
        let changes: number | null = null;

        const op = sql.trim().split(" ")[0].toUpperCase();
        if (op === "INSERT") {
            const row = [...this.raw.query("SELECT last_insert_rowid()")][0];
            lastID = row ? Number(row[0]) : null;
        }
        changes = this.raw.changes; 

        return { lastID, changes };
    }

    execSql(sql: string): Promise<void> {
        this.raw.execute(sql);
        return Promise.resolve();
    }

    selectOne<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
        const rows = [...this.raw.query(sql, this.processParams(params))];
        return Promise.resolve(rows[0] as T | undefined);
    }

    selectMany<T = any>(sql: string, params: any[] = []): Promise<T[]> {
        const rows = [...this.raw.query(sql, this.processParams(params))];
        return Promise.resolve(rows as T[]);
    }

    // ------------------ generic utils ------------------

    async transaction(fn: () => Promise<any>): Promise<any> {
        await this.execSql('BEGIN');
        try {
            const result = await fn();
            await this.execSql('COMMIT');
            return result;
        } catch (e) {
            await this.execSql('ROLLBACK');
            throw e;
        }
    }

    async userExists(userId: string): Promise<boolean> {
        const row = await this.selectOne(
            `SELECT user_id FROM users WHERE user_id = ?`,
            [userId]
        );
        return !!row;
    }

    async ensureUserExists(userId: string) {
        await this.runSql(
            `INSERT INTO users (user_id)
            VALUES (?)
            ON CONFLICT(user_id) DO NOTHING`,
            [userId]
        );
        await this.runSql(
            `INSERT INTO economy (user_id)
            VALUES (?)
            ON CONFLICT(user_id) DO NOTHING`,
            [userId]
        );
    }

    protected async selectTop(
        column: string,
        limit: number | null = null,
        tableName: string = 'users'
    ): Promise<string[]> {
        const sql = `
            SELECT user_id
            FROM ${tableName}
            ORDER BY ${column} DESC
            ${limit ? 'LIMIT ?' : ''}
        `;
        const params = limit ? [limit] : [];
        const rows = await this.selectMany<{ user_id: string }>(sql, params);
        return rows.map((r) => r.user_id);
    }

    readonly economy = {
        getTopWallet: async (max: number | null = null): Promise<User[]> => {
            const ids = await this.selectTop('wallet_money', max, 'economy');
            return ids.map((id) => new User(id));
        },

        getTopBank: async (max: number | null = null): Promise<User[]> => {
            const ids = await this.selectTop('bank_money', max, 'economy');
            return ids.map((id) => new User(id));
        },

        getTopTotal: async (max: number | null = null): Promise<User[]> => {
            const sql =
                `SELECT user_id FROM economy
                 ORDER BY (wallet_money + bank_money) DESC
                 ${max ? 'LIMIT ?' : ''}`;
            const params = max ? [max] : [];
            const rows = await this.selectMany<{ user_id: string }>(sql, params);
            return rows.map((r) => new User(r.user_id));
        },
    };

    readonly leveling = {
        getTop: async (max: number | null = null): Promise<User[]> => {
            const ids = await this.selectTop('xp', max, 'users');
            return ids.map((id) => new User(id));
        },
    };

    readonly reputation = {
        getAll: async (max: number | null = null): Promise<Rep[]> => {
            const rows = await this.selectMany<RepRaw>(
                `SELECT * FROM reputation ${max ? 'LIMIT ?' : ''}`,
                max ? [max] : []
            );
            return rows.map(repFromRaw);
        },
    };

    readonly warns = {
        getAll: async (max: number | null = null): Promise<Warn[]> => {
            const rows = await this.selectMany<WarnRaw>(
                `SELECT * FROM warns ${max ? 'LIMIT ?' : ''}`,
                max ? [max] : []
            );
            return rows.map(warnFromRaw);
        },
    };

    readonly reset = {
        economy: async (userId?: string): Promise<void> => {
            if (userId) {
                await this.runSql(`UPDATE economy SET wallet_money = 0, bank_money = 0 WHERE user_id = ?`, [userId]);
            } else {
                await this.runSql(`UPDATE economy SET wallet_money = 0, bank_money = 0`);
            }
        },

        inventory: async (userId?: string): Promise<void> => {
            if (userId) {
                await this.runSql(`DELETE FROM user_items WHERE user_id = ?`, [userId]);
            } else {
                await this.runSql(`DELETE FROM user_items`);
            }
        },

        leveling: async (userId?: string): Promise<void> => {
            if (userId) {
                await this.runSql(`UPDATE users SET xp = 0 WHERE user_id = ?`, [userId]);
            } else {
                await this.runSql(`UPDATE users SET xp = 0`);
            }
        },

        cooldowns: async (userId?: string): Promise<void> => {
            const sql = `
                UPDATE users SET 
                last_worked = 0, 
                last_robbed = 0, 
                last_slutted = 0, 
                last_crimed = 0, 
                last_email_sent = 0
                ${userId ? 'WHERE user_id = ?' : ''}
            `;
            await this.runSql(sql, userId ? [userId] : []);
        },

        reputation: async (userId?: string): Promise<void> => {
            if (userId) {
                await this.runSql(`DELETE FROM reputation WHERE author_id = ? OR target_user_id = ?`, [userId, userId]);
            } else {
                await this.runSql(`DELETE FROM reputation`);
            }
        },

        warns: async (userId?: string): Promise<void> => {
            if (userId) {
                await this.runSql(`DELETE FROM warns WHERE user_id = ?`, [userId]);
            } else {
                await this.runSql(`DELETE FROM warns`);
            }
        },

        all: async (userId?: string): Promise<void> => {
            await this.reset.economy(userId);
            await this.reset.inventory(userId);
            await this.reset.leveling(userId);
            await this.reset.cooldowns(userId);
            await this.reset.reputation(userId);
            await this.reset.warns(userId);
        }
    };
}

export const db = new BotDatabase('bot.db');
