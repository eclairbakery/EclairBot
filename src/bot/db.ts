import sqlite from 'sqlite3';

export const db = new sqlite.Database('bot.db');

/** @madebyai @author ChatGPT */
function addColumnIfNotExists(table: string, column: string, type: string, defaultValue: string | number = 0) {
    db.all(`PRAGMA table_info(${table});`, (err, rows) => {
        if (err) {
            throw err;
        }

        const exists = rows.some((col: any) => col.name === column);
        if (!exists) {
            const sql = `ALTER TABLE ${table} ADD COLUMN ${column} ${type} DEFAULT ${defaultValue};`;
            db.run(sql);
        }
    });
}

/**
 * Deletes a table from the database.
 * @param table The name of the table to delete.
 */
function delTable(table: string) {
    db.run(`DROP TABLE IF EXISTS ${table};`);
}

db.exec(`
    CREATE TABLE IF NOT EXISTS warns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        moderator_id TEXT NOT NULL,
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


db.exec(`
    CREATE TABLE IF NOT EXISTS economyAssets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        price REAL NOT NULL,
        lastUpdate TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS investments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userID TEXT NOT NULL,
        assetID INTEGER NOT NULL,
        amount REAL NOT NULL,
        buyPrice REAL NOT NULL,
        FOREIGN KEY(assetID) REFERENCES assets(id)
    );
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS reps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userID TEXT NOT NULL,
        targetUserID TEXT NOT NULL,

        comment TEXT,
        type TEXT NOT NULL CHECK(type IN ('+rep', '-rep')),

        UNIQUE(userID, targetUserID)
    );
`);

export { sqlite };
