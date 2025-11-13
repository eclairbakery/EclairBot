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

const fetchLevelingData = (db: SqliteDatabase): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM leveling', [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

const fetchEconomyData = (db: SqliteDatabase): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM economy', [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
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

            const [levelingData, economyData] = await Promise.all([
                levelingExists ? fetchLevelingData(db) : Promise.resolve([]),
                economyExists ? fetchEconomyData(db) : Promise.resolve([]),
            ]);

            const userDataMap: Record<string, any> = {};
            levelingData.forEach((row: any) => {
                userDataMap[row.user_id] = { xp: row.xp };
            });

            economyData.forEach((row: any) => {
                if (!userDataMap[row.user_id]) {
                    userDataMap[row.user_id] = {};
                }
                userDataMap[row.user_id] = {
                    ...userDataMap[row.user_id],
                    wallet_money: row.money,
                    bank_money: row.bank_money,
                    last_worked: row.last_worked,
                    last_robbed: row.last_robbed,
                    last_slutted: row.last_slutted,
                    last_crimed: row.last_crimed,
                };
            });

            const userInsertQueries: string[] = [];
            const userValues: any[] = [];

            Object.keys(userDataMap).forEach((user_id) => {
                const userData = userDataMap[user_id];
                userInsertQueries.push(`
                    INSERT OR REPLACE INTO users (user_id, xp, wallet_money, bank_money, last_worked, last_robbed, last_slutted, last_crimed)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?);
                `);
                userValues.push(user_id, userData.xp || 0, userData.wallet_money || 0, userData.bank_money || 0, userData.last_worked || 0, userData.last_robbed || 0, userData.last_slutted || 0, userData.last_crimed || 0);
            });

            db.run(userInsertQueries.join(' '), userValues, (err) => {
                if (err) {
                    output.err('usersTable: vulnerable, mitigation failed: ' + err);
                } else {
                    output.err('usersTable: mitigation, moved data to users table');
                }
            });
        } else {
            output.log('usersTable: not affected');
        }
    } catch (error) {
        output.err('usersTable: vulnerable, mitigation failed: ' + error);
    }
}