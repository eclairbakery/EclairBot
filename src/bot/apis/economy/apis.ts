import { db } from "@/bot/db.js";

async function getBalance(userId: string): Promise<{ money: number, bank_money: number }> {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM economy WHERE user_id = ?', [userId], (err, row: any) => {
            if (err) return reject(err);
            resolve(row ?? { money: 0, bank_money: 0 });
        });
    });
}

async function updateBalance(userId: string, money: number, bank_money: number) {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO economy (user_id, money, bank_money) VALUES (?, ?, ?)
             ON CONFLICT(user_id) DO UPDATE SET money = ?, bank_money = ?`,
            [userId, money, bank_money, money, bank_money],
            (err) => {
                if (err) return reject(err);
                resolve(null);
            }
        );
    });
}

export { updateBalance, getBalance };