import * as sqlite from 'sqlite3';
export * as sqlite from 'sqlite3';

export const db = new sqlite.Database('bot.db');
db.exec(
    'CREATE TABLE IF NOT EXISTS warns (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, reason_string TEXT NOT NULL, points INTEGER NOT NULL);',
);