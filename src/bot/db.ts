import sqlite from 'sqlite3';

export const db = new sqlite.Database('bot.db');
db.exec(
    'CREATE TABLE IF NOT EXISTS warns (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, reason_string TEXT NOT NULL, points INTEGER NOT NULL, expires_at INTEGER);',
);
db.exec(
    'CREATE TABLE IF NOT EXISTS economy (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL UNIQUE, money INTEGER NOT NULL, last_worked INTEGER NOT NULL, last_robbed INTEGER NOT NULL, last_slutted INTEGER NOT NULL, last_crimed INTEGER NOT NULL);'
);
db.exec(
    'CREATE TABLE IF NOT EXISTS leveling (user_id TEXT UNIQUE, id INTEGER, xp INTEGER);'
);

export { sqlite };