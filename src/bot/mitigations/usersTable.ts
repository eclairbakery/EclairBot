import type { Database as SqliteDatabase } from 'sqlite3';
import { output } from '../logging.js';

const tableExists = (tableName: string, db: SqliteDatabase): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        db.get(`
            SELECT name FROM sqlite_master WHERE type='table' AND name = ?;
        `, [tableName], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row !== undefined);
            }
        });
    });
};

const countRows = (tableName: string, db: SqliteDatabase): Promise<number> => {
    return new Promise((resolve, reject) => {
        db.get(`
            SELECT COUNT(*) AS count FROM ${tableName};
        `, (err, row: any) => {
            if (err) {
                reject(err);
            } else {
                resolve(row.count);
            }
        });
    });
};

export async function mitigateToUsersTable(db: SqliteDatabase) {
    try {
        const economyExists = await tableExists('economy', db);
        const levelingExists = await tableExists('leveling', db);

        if (economyExists || levelingExists) {
            if (await countRows('users', db) > 0) {
                output.log('usersTable: mitigation, data already moved');
                return;
            }

            if (levelingExists) {
                db.all('SELECT * FROM leveling', [], (err, rows) => {
                    if (err) {
                        console.error(err);
                    } else {
                        rows.forEach((row: any) => {
                            db.run(`
                                UPDATE users SET xp = ? WHERE user_id = ?;
                            `, [row.xp, row.user_id]);
                        });
                    }
                });
            }

            if (economyExists) {
                db.all('SELECT * FROM economy', [], (err, rows) => {
                    if (err) {
                        console.error(err);
                    } else {
                        rows.forEach((row: any) => {
                            db.run(`
                                INSERT OR REPLACE INTO users (user_id, wallet_money, bank_money, last_worked, last_robbed, last_slutted, last_crimed)
                                VALUES (?, ?, ?, ?, ?, ?, ?);
                            `, [row.user_id, row.money, row.bank_money, row.last_worked, row.last_robbed, row.last_slutted, row.last_crimed]);
                        });
                    }
                });
            }

            output.log('usersTable: mitigation, moved data to users table');
        } else {
            output.log('usersTable: not affected');
        }
    } catch (error) {
        output.err('usersTable: vulnerable, mitigation failed: ' + error);
    }
}