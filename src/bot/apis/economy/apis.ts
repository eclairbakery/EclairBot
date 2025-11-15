/**
 * @deprecated - THIS FILE WAS MARKED AS DEPRECATED ON 12.11.2025
 * 
 * The economy API was deprecated in flavour of @link {/src/bot/apis/db/user.ts}
 */

import { output } from "@/bot/logging.js";
import User from "../db/user.js";

/** 
 * @deprecated
 * The economy API was deprecated in flavour of @link {/src/bot/apis/db/user.ts}
 */
async function getBalance(userId: string): Promise<{ money: number, bank_money: number }> {
    const bruh = await (new User(userId)).economy.getBalance();
    return {
        money: bruh.wallet,
        bank_money: bruh.bank
    };
}

/** 
 * @deprecated
 * The economy API was deprecated in flavour of @link {/src/bot/apis/db/user.ts}
 */
async function updateBalance(userId: string, money: number, bank_money: number) {
    const bruh = new User(userId);
    bruh.economy.setBalance({
        bank: bank_money,
        wallet: money
    });
}

export { updateBalance, getBalance };