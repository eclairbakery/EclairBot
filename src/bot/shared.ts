import { db } from './db.js';

const dbGet = (sql: string, params: any[] = []): Promise<any> =>
    new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });

const dbRun = (sql: string, params: any[] = []): Promise<{ lastID: number, changes: number }> =>
    new Promise((resolve, reject) => {
        db.run(sql, params, function (this: any, err: Error | null) {
            if (err) reject(err);
            else resolve({ lastID: this.lastID, changes: this.changes });
        });
    });

function getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export { dbGet, dbRun, getRandomInt };