import { db } from '@/bot/apis/db/bot-db.ts';

import { Balance, Rep, RepRaw, Warn, WarnRaw } from './db-defs.ts';
import { Cooldowns } from './db-defs.ts';
import { repFromRaw, warnFromRaw } from './db-defs.ts';
import Money from '@/util/money.ts';

const CooldownMap = {
    'work': { col: 'last_worked', prop: 'lastWorked' },
    'rob': { col: 'last_robbed', prop: 'lastRobbed' },
    'slut': { col: 'last_slutted', prop: 'lastSlutted' },
    'crime': { col: 'last_crimed', prop: 'lastCrimed' },
    'collect-income': { col: 'last_collect_income', prop: 'lastCollectIncome' },
    'email': { col: 'last_email_sent', prop: 'lastEmailSent' },
} as const;

export interface CooldownReady {
    can: true;
}
export interface CooldownWaiting {
    can: false;
    waitMs: number;
    waitSec: number;
    endAt: number;
    endAtUnix: number;
    discordTime: string;
}

export type CooldownCheckResult = CooldownReady | CooldownWaiting;

type CooldownKey = keyof typeof CooldownMap;

export default class User {
    readonly id: string;

    constructor(userId: string) {
        this.id = userId;
    }

    async ensureExists() {
        await db.ensureUserExists(this.id);
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

        getEveryoneXPWithLimit: async (limit: number): Promise<{ xp: number; user_id: string }[]> => {
            await this.ensureExists();
            const rows = await db.selectMany(`SELECT xp, user_id FROM users ORDER BY xp DESC LIMIT ?`, [limit]) ?? [];
            return rows;
        },

        getEveryoneXPNoLimit: async (): Promise<{ xp: number; user_id: string }[]> => {
            await this.ensureExists();
            const rows = await db.selectMany(`SELECT xp, user_id FROM users ORDER BY xp DESC`, []) ?? [];
            return rows;
        },

        getTotalServerXP: async (): Promise<number> => {
            const row = await db.selectOne(`SELECT SUM(xp) AS totalXP FROM users`);
            return row?.totalXP ?? 0;
        },
    };

    readonly email = {
        getSignature: async (): Promise<string | undefined> => {
            await this.ensureExists();
            const row = await db.selectOne<{ signature: string | undefined }>(
                `SELECT user_id, signature FROM users WHERE user_id = ?`,
                [this.id],
            );
            if (row?.signature == '') {
                return undefined;
            }
            return row?.signature;
        },

        setSignature: async (userId: string, signature: string) => {
            await db.runSql(
                `UPDATE users SET signature = ? WHERE user_id = ?`,
                [signature, userId],
            );
        },

        deleteSignature: async (userId: string) => {
            await db.runSql(
                `UPDATE users SET signature = NULL WHERE user_id = ?`,
                [userId],
            );
        },

        getDefaultTitle: async (): Promise<string | undefined> => {
            await this.ensureExists();
            const row = await db.selectOne<{ default_email_title: string | undefined }>(
                `SELECT user_id, default_email_title FROM users WHERE user_id = ?`,
                [this.id],
            );
            if (row?.default_email_title == '') {
                return undefined;
            }
            return row?.default_email_title;
        },

        setDefaultTitle: async (userId: string, signature: string) => {
            await db.runSql(
                `UPDATE users SET default_email_title = ? WHERE user_id = ?`,
                [signature, userId],
            );
        },

        deleteDefaultTitle: async (userId: string) => {
            await db.runSql(
                `UPDATE users SET default_email_title = NULL WHERE user_id = ?`,
                [userId],
            );
        },
    };

    /** -------- ECONOMY -------- */
    readonly economy = {
        getBalance: async (): Promise<Balance> => {
            await this.ensureExists();
            const row = await db.selectOne<{ wallet_money: number; bank_money: number }>(
                `SELECT wallet_money, bank_money FROM economy WHERE user_id = ?`,
                [this.id],
            );
            return {
                wallet: Money.fromCents(BigInt(Math.round(row?.wallet_money ?? 0))),
                bank: Money.fromCents(BigInt(Math.round(row?.bank_money ?? 0))),
            };
        },

        setBalance: async (bal: Balance) => {
            await this.ensureExists();
            await db.runSql(
                `UPDATE economy
                 SET wallet_money = ?, bank_money = ?
                 WHERE user_id = ?`,
                [bal.wallet.asCents(), bal.bank.asCents(), this.id],
            );
        },

        addWalletMoney: async (amount: Money) => {
            await this.ensureExists();
            return db.runSql(
                `UPDATE economy SET wallet_money = wallet_money + ? WHERE user_id = ?`,
                [amount.asCents(), this.id],
            );
        },

        deductWalletMoney: async (amount: Money) => {
            await this.ensureExists();
            return db.runSql(
                `UPDATE economy SET wallet_money = wallet_money - ? WHERE user_id = ?`,
                [amount.asCents(), this.id],
            );
        },

        setWalletMoney: async (value: Money) => {
            await this.ensureExists();
            return db.runSql(
                `UPDATE economy SET wallet_money = ? WHERE user_id = ?`,
                [value.asCents(), this.id],
            );
        },

        addBankMoney: async (amount: Money) => {
            await this.ensureExists();
            return db.runSql(
                `UPDATE economy SET bank_money = bank_money + ? WHERE user_id = ?`,
                [amount.asCents(), this.id],
            );
        },

        deductBankMoney: async (amount: Money) => {
            await this.ensureExists();
            return db.runSql(
                `UPDATE economy SET bank_money = bank_money - ? WHERE user_id = ?`,
                [amount.asCents(), this.id],
            );
        },

        setBankMoney: async (value: Money) => {
            await this.ensureExists();
            return db.runSql(
                `UPDATE economy SET bank_money = ? WHERE user_id = ?`,
                [value.asCents(), this.id],
            );
        },

        depositToBank: async (amount: Money) => {
            await this.ensureExists();
            const cents = amount.asCents();
            await db.runSql(
                `UPDATE economy
                 SET wallet_money = wallet_money - ?, bank_money = bank_money + ?
                 WHERE user_id = ?`,
                [cents, cents, this.id],
            );
        },

        withdrawFromBank: async (amount: Money) => {
            await this.ensureExists();
            const cents = amount.asCents();
            await db.runSql(
                `UPDATE economy
                 SET bank_money = bank_money - ?, wallet_money = wallet_money + ?
                 WHERE user_id = ?`,
                [cents, cents, this.id],
            );
        },
    };

    /** -------- GAMES -------- */
    readonly games = {
        getActive: async (): Promise<string[]> => {
            const rows = await db.selectMany<{ game_id: string }>(
                `SELECT game_id FROM user_active_games WHERE user_id = ?`,
                [this.id],
            );
            return rows.map((r) => r.game_id);
        },

        anyActive: async () => {
            const active = await this.games.getActive();
            return active.length != 0;
        },

        isPlaying: async (gameId: string): Promise<boolean> => {
            const row = await db.selectOne(
                `SELECT game_id FROM user_active_games WHERE user_id = ? AND game_id = ?`,
                [this.id, gameId],
            );
            return !!row;
        },

        add: async (gameId: string) => {
            await this.ensureExists();
            await db.runSql(
                `INSERT OR IGNORE INTO user_active_games (user_id, game_id) VALUES (?, ?)`,
                [this.id, gameId],
            );
        },

        remove: async (gameId: string) => {
            await db.runSql(
                `DELETE FROM user_active_games WHERE user_id = ? AND game_id = ?`,
                [this.id, gameId],
            );
        },

        clearAll: async () => {
            await db.runSql(
                `DELETE FROM user_active_games WHERE user_id = ?`,
                [this.id],
            );
        },
    };

    /** -------- INVENTORY -------- */
    readonly inventory = {
        getItems: async (): Promise<{ item_id: string; amount: number }[]> => {
            return db.selectMany(`SELECT item_id, amount FROM user_items WHERE user_id = ?`, [this.id]);
        },

        getItemAmount: async (itemId: string): Promise<number> => {
            const row = await db.selectOne<{ amount: number }>(
                `SELECT amount FROM user_items WHERE user_id = ? AND item_id = ?`,
                [this.id, itemId],
            );
            return row?.amount ?? 0;
        },

        addItem: async (itemId: string, amount: number = 1) => {
            await this.ensureExists();
            return db.runSql(
                `INSERT INTO user_items (user_id, item_id, amount)
                 VALUES (?, ?, ?)
                 ON CONFLICT(user_id, item_id) DO UPDATE SET amount = amount + ?`,
                [this.id, itemId, amount, amount],
            );
        },

        removeItem: async (itemId: string, amount: number = 1) => {
            await this.ensureExists();
            await db.runSql(
                `UPDATE user_items SET amount = amount - ? WHERE user_id = ? AND item_id = ?`,
                [amount, this.id, itemId],
            );
            await db.runSql(`DELETE FROM user_items WHERE user_id = ? AND item_id = ? AND amount <= 0`, [this.id, itemId]);
        },

        hasItem: async (itemId: string, amount: number = 1): Promise<boolean> => {
            const current = await this.inventory.getItemAmount(itemId);
            return current >= amount;
        },
    };

    /** ------- PURCHASES -------- */
    readonly purchases = {
        add: async (offerId: string) => {
            await this.ensureExists();
            return db.runSql(
                `INSERT INTO user_purchases (user_id, offer_id, amount)
                 VALUES (?, ?, 1)
                 ON CONFLICT(user_id, offer_id) DO UPDATE SET amount = amount + 1`,
                [this.id, offerId],
            );
        },

        getPurchaseCount: async (offerId: string): Promise<number> => {
            const row = await db.selectOne<{ amount: number }>(
                `SELECT amount FROM user_purchases WHERE user_id = ? AND offer_id = ?`,
                [this.id, offerId],
            );
            return row?.amount ?? 0;
        },

        hasBought: async (offerId: string): Promise<boolean> => {
            const count = await this.purchases.getPurchaseCount(offerId);
            return count > 0;
        },
    };

    /** -------- COOLDOWNS -------- */
    readonly cooldowns = {
        set: async (field: CooldownKey, timestamp: number) => {
            const fieldData = CooldownMap[field];
            await this.ensureExists();
            await db.runSql(`UPDATE users SET ${fieldData.col} = ? WHERE user_id = ?`, [timestamp, this.id]);
        },

        get: async (): Promise<Cooldowns> => {
            await this.ensureExists();
            const cols = Object.values(CooldownMap).map((v) => v.col).join(', ');
            const row = await db.selectOne<any>(
                `SELECT ${cols} FROM users WHERE user_id = ?`,
                [this.id],
            );

            const result = {} as any;
            for (const key of Object.keys(CooldownMap)) {
                const k = key as CooldownKey;
                result[CooldownMap[k].prop] = row?.[CooldownMap[k].col] ?? null;
            }
            return result as Cooldowns;
        },

        check: async (field: CooldownKey, cooldownMs: number): Promise<CooldownCheckResult> => {
            const cds = await this.cooldowns.get();
            const last = cds[CooldownMap[field].prop] ?? 0;
            const now = Date.now();
            const diff = now - last;

            if (diff < cooldownMs) {
                const remainingMs = cooldownMs - diff;
                const endAt = now + remainingMs;
                const endAtUnix = Math.floor(endAt / 1000);

                return {
                    can: false,
                    waitMs: remainingMs,
                    waitSec: Math.ceil(remainingMs / 1000),
                    endAt,
                    endAtUnix,
                    discordTime: `<t:${endAtUnix}:R>`,
                };
            }

            return { can: true };
        },
    };

    /** -------- REPUTATION -------- */
    readonly reputation = {
        give: async (targetId: string, type: '+rep' | '-rep', comment?: string) => {
            return db.runSql(
                `INSERT INTO reputation (author_id, target_user_id, type, comment)
                 VALUES (?, ?, ?, ?)`,
                [this.id, targetId, type, comment ?? null],
            );
        },

        getReceived: async (): Promise<Rep[]> => {
            const rawReps = await db.selectMany<RepRaw>(
                `SELECT * FROM reputation WHERE target_user_id = ? ORDER BY created_at DESC`,
                [this.id],
            );
            return rawReps.map(repFromRaw);
        },

        getGiven: async (): Promise<Rep[]> => {
            const rawReps = await db.selectMany<RepRaw>(
                `SELECT * FROM reputation WHERE author_id = ? ORDER BY created_at DESC`,
                [this.id],
            );
            return rawReps.map(repFromRaw);
        },

        getAll: async (): Promise<Rep[]> => {
            const rawReps = await db.selectMany<RepRaw>(
                `SELECT * FROM reputation`,
                [],
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
                [this.id, moderatorId, reason, points, expiresAt ?? null],
            );
        },

        getAll: async (): Promise<Warn[]> => {
            const rawWarns = await db.selectMany<WarnRaw>(
                `SELECT * FROM warns WHERE user_id = ? ORDER BY id DESC`,
                [this.id],
            );
            return rawWarns.map(warnFromRaw);
        },

        clearExpired: async () => {
            const now = Date.now();
            return db.runSql(
                `DELETE FROM warns WHERE expires_at IS NOT NULL AND expires_at <= ?`,
                [now],
            );
        },
    };
}
