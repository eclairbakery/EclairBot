import { DB, QueryParameterSet } from 'sqlite';

import type { AIMemory, MusicEntry, MusicEntryRaw, Reminder, UserDataRaw, Warn, WarnRaw } from './db-defs.ts';

import type { Balance, Cooldown, Cooldowns } from './db-defs.ts';
import { musicFromRaw, warnFromRaw } from './db-defs.ts';

export type { MusicEntry, MusicEntryRaw, UserDataRaw, Warn, WarnRaw };
export type { Balance, Cooldown, Cooldowns };
export { musicFromRaw, warnFromRaw };

import User from './user.ts';
import { output } from '@/bot/logging.ts';

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
                default_email_title TEXT,

                prestige_points INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS user_active_games (
                user_id TEXT NOT NULL REFERENCES users(user_id),
                game_id TEXT NOT NULL,
                PRIMARY KEY (user_id, game_id)
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

            CREATE TABLE IF NOT EXISTS alternative_accounts (
                primary_account TEXT NOT NULL REFERENCES users(user_id),
                alternative_account TEXT NOT NULL REFERENCES users(user_id),
                PRIMARY KEY (primary_account, alternative_account)
            );

            CREATE TABLE IF NOT EXISTS music_database (
                author_id TEXT NOT NULL REFERENCES users(user_id),
                music_url TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS ai_memories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                memory TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS reminders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                for_user TEXT NOT NULL REFERENCES users(user_id),
                reminder TEXT NOT NULL,
                timestamp INTEGER NOT NULL
            );
        `);
    }

    // ------------------ low-level helpers ------------------

    private processParams(params: unknown[]): unknown[] {
        return params.map((p) => {
            if (typeof p != "bigint") return p;

            let result = Number(p);
            if (!Number.isSafeInteger(result)) { 
                output.warn("Invalid BigInt passed to processParams, params: " + params.join(', '));
                result = Number.MAX_SAFE_INTEGER;
            }
            return result;
        });
    }

    async runSql(sql: string, params: unknown[] = []): Promise<DBRunResult> {
        this.raw.query(sql, this.processParams(params) as QueryParameterSet);
        let lastID: number | null = null;
        let changes: number | null = null;

        const op = sql.trim().split(' ')[0].toUpperCase();
        if (op === 'INSERT') {
            const row = [...this.raw.queryEntries('SELECT last_insert_rowid()')][0];
            lastID = row ? Number(row["last_insert_rowid()"]) : null;
        }
        changes = this.raw.changes;

        return { lastID, changes };
    }

    execSql(sql: string): Promise<void> {
        this.raw.execute(sql);
        return Promise.resolve();
    }

    // deno-lint-ignore no-explicit-any
    selectOne<T = any>(sql: string, params: unknown[] = []): Promise<T | undefined> {
        const rows = [...this.raw.queryEntries(sql, this.processParams(params) as QueryParameterSet)];
        return Promise.resolve(rows[0] as T | undefined);
    }

    // deno-lint-ignore no-explicit-any
    selectOneSync<T = any>(sql: string, params: unknown[] = []): T | undefined {
        const rows = [...this.raw.queryEntries(sql, this.processParams(params) as QueryParameterSet)];
        return rows[0] as T | undefined;
    }

    // deno-lint-ignore no-explicit-any
    selectMany<T = any>(sql: string, params: unknown[] = []): Promise<T[]> {
        const rows = [...this.raw.queryEntries(sql, this.processParams(params) as QueryParameterSet)];
        return Promise.resolve(rows as T[]);
    }

    // ------------------ generic utils ------------------

    async transaction<T>(fn: () => Promise<T>): Promise<T> {
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
        const alt_entry = await this.selectOne(`SELECT * FROM alternative_accounts WHERE alternative_account = ?`, [userId]);
        if (alt_entry) userId = alt_entry.primary_account;

        const row = await this.selectOne(
            `SELECT user_id FROM users WHERE user_id = ?`,
            [userId],
        );
        return !!row;
    }

    async ensureUserExists(userId: string) {
        const alt_entry = await this.selectOne(`SELECT * FROM alternative_accounts WHERE alternative_account = ?`, [userId]);
        if (alt_entry) userId = alt_entry.primary_account;

        await this.runSql(
            `INSERT INTO users (user_id)
            VALUES (?)
            ON CONFLICT(user_id) DO NOTHING`,
            [userId],
        );
        await this.runSql(
            `INSERT INTO economy (user_id)
            VALUES (?)
            ON CONFLICT(user_id) DO NOTHING`,
            [userId],
        );
    }

    protected async selectTop(
        column: string,
        limit: number | null = null,
        tableName: string = 'users',
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
            const sql = `SELECT user_id FROM economy
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

    readonly prestige = {
        getTop: async (max: number | null = null): Promise<User[]> => {
            const ids = await this.selectTop('prestige_points', max, 'users');
            return ids.map((id) => new User(id));
        },
    };

    readonly warns = {
        getAll: async (max: number | null = null): Promise<Warn[]> => {
            const rows = await this.selectMany<WarnRaw>(
                `SELECT * FROM warns ${max ? 'LIMIT ?' : ''}`,
                max ? [max] : [],
            );
            return rows.map(warnFromRaw);
        },
    };

    readonly ai = {
        getMemories: async (data: { limit?: number; offset?: number }): Promise<AIMemory[]> => {
            let sql = 'SELECT id, memory FROM ai_memories';
            const params: number[] = [];
            if (data.limit) {
                sql += ' LIMIT ?';
                params.push(data.limit);
            }
            if (data.offset) {
                sql += ' OFFSET ?';
                params.push(data.offset);
            }
            return await this.selectMany<AIMemory>(sql, params);
        },
        saveMemory: async (memory: string, associatedWithUserId?: string) => {
            const finalMemory = (associatedWithUserId ? `Powiązane z użytkownikiem o ID: ${associatedWithUserId}\n` : '') + memory;
            return await this.runSql('INSERT INTO ai_memories (memory) VALUES (?)', [finalMemory]);
        },
    };

    readonly music = {
        addEntry: async (authorId: string, musicUrl: string): Promise<void> => {
            await this.ensureUserExists(authorId);

            if (await this.selectOne("SELECT * FROM music_database WHERE music_url = ?"))
                return;
            await this.runSql(
                `INSERT INTO music_database (author_id, music_url) VALUES (?, ?)`,
                [authorId, musicUrl],
            );
        },

        getRandomEntry: async (): Promise<MusicEntry | undefined> => {
            const row = await this.selectOne<MusicEntryRaw>(
                `SELECT * FROM music_database ORDER BY RANDOM() LIMIT 1`,
            );
            return row ? musicFromRaw(row) : undefined;
        },

        getEntriesByUser: async (userId: string): Promise<MusicEntry[]> => {
            const rows = await this.selectMany<MusicEntryRaw>(
                `SELECT * FROM music_database WHERE author_id = ?`,
                [userId],
            );
            return rows.map(musicFromRaw);
        },

        batchAddEntries: async (entries: MusicEntry[]): Promise<void> => {
            if (entries.length === 0) return;

            const userIds = [...new Set(entries.map((e) => e.authorId))];
            for (const userId of userIds) {
                await this.ensureUserExists(userId);
            }

            await this.transaction(async () => {
                for (const entry of entries) {
                    await this.runSql(
                        `INSERT INTO music_database (author_id, music_url) VALUES (?, ?)`,
                        [entry.authorId, entry.musicUrl],
                    );
                }
                return Promise.resolve();
            });
        },
        clear: async (userId?: string): Promise<void> => {
            await this.reset.music(userId);
        },
    };
    
    readonly reminders = {
        getReminders: async (): Promise<Reminder[]> => {
            return db.selectMany<Reminder>("SELECT * FROM reminders");
        },
        addReminder: async (target: string, reminder: string, date: number) => {
            return db.runSql("INSERT INTO reminders (for_user, reminder, timestamp) VALUES (?, ?, ?)", [ target, reminder, date ]);
        },
        deleteReminder: async (id: number) => {
            return db.runSql("DELETE FROM reminders WHERE id = ?", [id])
        }
    };

    readonly reset = {
        music: async (userId?: string): Promise<void> => {
            if (userId) {
                await this.runSql(`DELETE FROM music_database WHERE author_id = ?`, [userId]);
            } else {
                await this.runSql(`DELETE FROM music_database`);
            }
        },

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

        prestige: async (userId?: string): Promise<void> => {
            if (userId) {
                await this.runSql(`UPDATE users SET prestige_points = 0 WHERE user_id = ?`, [userId]);
            } else {
                await this.runSql(`UPDATE users SET prestige_points = 0`);
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
            await this.reset.warns(userId);
            await this.reset.prestige(userId);
            // i think it's better not to do this for now
            //await this.reset.music(userId);
        },
    };
}

export const db = new BotDatabase('bot.db');
