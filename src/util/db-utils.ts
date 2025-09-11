import { db } from '@/bot/db.js';

export interface DBRunResult {
    lastID: number | null;
    changes: number | null;
};

export function dbRun(sql: string, params: any[] = []): Promise<DBRunResult> {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (this: DBRunResult, err: Error | null) {
            if (err) reject(err);
            else resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
}

export function dbGet<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row as T);
        });
    });
}

export function dbAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows as T[]);
    });
  });
}
