import sqlite from 'sqlite3';

export const db = new sqlite.Database('bot.db');

/** @madebyai @author ChatGPT */
function addColumnIfNotExists(table: string, column: string, type: string, defaultValue: string | number = 0) {
    db.all(`PRAGMA table_info(${table});`, (err, rows) => {
        if (err) {
            console.error(`Błąd przy sprawdzaniu tabeli ${table}:`, err);
            return;
        }

        const exists = rows.some((col: any) => col.name === column);
        if (!exists) {
            const sql = `ALTER TABLE ${table} ADD COLUMN ${column} ${type} DEFAULT ${defaultValue};`;
            db.run(sql, (err) => {
                if (err) {
                    console.error(`Błąd przy dodawaniu kolumny ${column} do ${table}:`, err);
                } else {
                    console.log(`Dodano kolumnę ${column} do tabeli ${table}.`);
                }
            });
        }
    });
}

db.exec(`
    CREATE TABLE IF NOT EXISTS warns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        reason_string TEXT NOT NULL,
        points INTEGER NOT NULL,
        expires_at INTEGER
    );
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS economy (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL UNIQUE,
        money INTEGER NOT NULL,
        last_worked INTEGER NOT NULL DEFAULT 0,
        last_robbed INTEGER NOT NULL DEFAULT 0,
        last_slutted INTEGER NOT NULL DEFAULT 0,
        last_crimed INTEGER NOT NULL DEFAULT 0
    );
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS leveling (
        user_id TEXT UNIQUE,
        id INTEGER,
        xp INTEGER
    );
`);

addColumnIfNotExists("warns", "expires_at", "INTEGER", 0);

export {sqlite};