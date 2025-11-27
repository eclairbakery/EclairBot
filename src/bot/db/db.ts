import sqlite from 'sqlite3';

import type { UserDataRaw, Warn, WarnRaw, Rep, RepRaw } from '../defs/db.js';
import type { Balance, Cooldown, Cooldowns } from '../defs/db.js';
import { warnFromRaw, repFromRaw } from '../defs/db.js';

export type { UserDataRaw, Warn, WarnRaw, Rep, RepRaw };
export type { Balance, Cooldown, Cooldowns };
export { warnFromRaw, repFromRaw };

import User from './user.js';

export interface DBRunResult {
    lastID: number | null;
    changes: number | null;
}

export class BotDatabase {
    protected raw: sqlite.Database;

    constructor(dbPath: string) {
        this.raw = new sqlite.Database(dbPath);
    }

    async init(): Promise<void> {
        await this.execSql(`
            CREATE TABLE IF NOT EXISTS users (
                user_id TEXT PRIMARY KEY,
                xp INTEGER DEFAULT 0,
                wallet_money REAL DEFAULT 0,
                bank_money REAL DEFAULT 0,
                last_worked INTEGER DEFAULT 0,
                last_robbed INTEGER DEFAULT 0,
                last_slutted INTEGER DEFAULT 0,
                last_crimed INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS warns (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL REFERENCES users(user_id),
                moderator_id TEXT NOT NULL,
                reason_string TEXT NOT NULL,
                points INTEGER NOT NULL,
                expires_at INTEGER
            );

            CREATE TABLE IF NOT EXISTS items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                owner_id TEXT NOT NULL REFERENCES users(user_id),
                type TEXT NOT NULL CHECK(type IN ('mystery-box', 'check', 'role')),
                item_properties TEXT
            );

            CREATE TABLE IF NOT EXISTS reputation (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                author_id TEXT NOT NULL REFERENCES users(user_id),
                target_user_id TEXT NOT NULL REFERENCES users(user_id),
                comment TEXT,
                type TEXT NOT NULL CHECK(type IN ('+rep', '-rep'))
            );
        `);
    }

    // ------------------ low-level helpers ------------------

    runSql(sql: string, params: any[] = []): Promise<DBRunResult> {
        return new Promise((resolve, reject) => {
            this.raw.run(sql, params, function (this: sqlite.RunResult, err) {
                if (err) reject(err.message);
                else resolve({ lastID: this.lastID, changes: this.changes });
            });
        });
    }

    execSql(sql: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.raw.exec(sql, (err) => {
                if (err) reject(err.message);
                else resolve();
            });
        });
    }

    selectOne<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
        return new Promise((resolve, reject) => {
            this.raw.get(sql, params, (err, row) => {
                if (err) reject(err.message);
                else resolve(row as T);
            });
        });
    }

    selectMany<T = any>(sql: string, params: any[] = []): Promise<T[]> {
        return new Promise((resolve, reject) => {
            this.raw.all(sql, params, (err, rows) => {
                if (err) reject(err.message);
                else resolve(rows as T[]);
            });
        });
    }

    // ------------------ generic utils ------------------

    async transaction(fn: () => Promise<any>): Promise<any> {
        await this.execSql("BEGIN");
        try {
            const result = await fn();
            await this.execSql("COMMIT");
            return result;
        } catch (e) {
            await this.execSql("ROLLBACK");
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
    }

    protected async selectTop(
        column: string,
        limit: number | null = null
    ): Promise<string[]> {
        const sql = `
            SELECT user_id
            FROM users
            ORDER BY ${column} DESC
            ${limit ? "LIMIT ?" : ""}
        `;
        const params = limit ? [limit] : [];
        const rows = await this.selectMany<{ user_id: string }>(sql, params);
        return rows.map((r) => r.user_id);
    }

    readonly economy = {
        getTopWallet: async (max: number | null = null): Promise<User[]> => {
            const ids = await this.selectTop("wallet_money", max);
            return ids.map((id) => new User(id));
        },

        getTopBank: async (max: number | null = null): Promise<User[]> => {
            const ids = await this.selectTop("bank_money", max);
            return ids.map((id) => new User(id));
        },

        getTopTotal: async (max: number | null = null): Promise<User[]> => {
            const sql =
                `SELECT user_id FROM users
                 ORDER BY (wallet_money + bank_money) DESC
                 ${max ? "LIMIT ?" : ""}`;
            const params = max ? [max] : [];
            const rows = await this.selectMany<{ user_id: string }>(sql, params);
            return rows.map((r) => new User(r.user_id));
        },
    };

    readonly leveling = {
        getTop: async (max: number | null = null): Promise<User[]> => {
            const ids = await this.selectTop("xp", max);
            return ids.map((id) => new User(id));
        },
    };

    readonly reputation = {
        getAll: async (max: number | null = null): Promise<Rep[]> => {
            const rows = await this.selectMany<RepRaw>(
                `SELECT * FROM reputation ${max ? "LIMIT ?" : ""}`,
                max ? [max] : []
            );
            return rows.map(repFromRaw);
        },
    };

    readonly warns = {
        getAll: async (max: number | null = null): Promise<Warn[]> => {
            const rows = await this.selectMany<WarnRaw>(
                `SELECT * FROM warns ${max ? "LIMIT ?" : ""}`,
                max ? [max] : []
            );
            return rows.map(warnFromRaw);
        },
    };
}

export const db = new BotDatabase('bot.db');
