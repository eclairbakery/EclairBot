import sqlite from 'sqlite3';
import { mitigateToUsersTable } from './mitigations/usersTable.js';

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
 * @author ChatGPT @madebyai idk who even needs this
 */
function delTable(table: string) {
    db.run(`DROP TABLE IF EXISTS ${table};`);
}

void addColumnIfNotExists, delTable;

db.exec("PRAGMA foreign_keys = ON;");

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        user_id TEXT PRIMARY KEY,
    
        -- leveling data
        xp INTEGER DEFAULT 0,
       
        -- economy data
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

        item_properties TEXT   -- JSON with type-specific info
                               -- for mystery-box: {'id': string}
                               -- for role:        {'id': string}
                               -- for check:       {'amount': number}
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

export async function performMitigations() {
    await mitigateToUsersTable(db);
}

export { sqlite };

// maqix was here
// and gorciu deleted your ugly lines