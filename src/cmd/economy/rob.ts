import * as dsc from 'discord.js';
import * as log from '@/util/log.js';

import { dbGet, dbRun } from '@/util/dbUtils.js';
import { getRandomFloat, getRandomInt } from '@/util/math/rand.js';

import { Command, CommandArgumentWithUserMentionOrMsgReferenceValue, CommandFlags } from '@/bot/command.js';
import { PredefinedColors } from '@/util/color.js';
import { output } from '@/bot/logging.js';
import { cfg } from '@/bot/cfg.js';
import User from '@/bot/apis/db/user.js';

const COOLDOWN_MS = 5 * 60 * 1000;
const BASE_SUCCESS_CHANCE = 0.5;
const MIN_PERCENT = 0.05;
const MAX_PERCENT = 0.25;
const MIN_STEALABLE = 50;

async function canRob(userId: string): Promise<{ can: boolean; wait?: number }> {
    const user = new User(userId);
    const cooldowns = await user.economy.getCooldowns();

    const now = Date.now();
    if (cooldowns.lastRobbed == null) return { can: true };
    const timeSinceLast = now - cooldowns.lastRobbed;
    if (timeSinceLast < COOLDOWN_MS) {
        return { can: false, wait: COOLDOWN_MS - timeSinceLast };
    }
    return { can: true };
}

function randomPercentBetween(min: number, max: number): number {
    return getRandomFloat(min, max);
}

async function tryRob(attackerId: string, targetId: string): Promise<{ ok: boolean; amount?: number; wait?: number; success?: boolean; percent?: number; reason?: string }> {
    const check = await canRob(attackerId);
    if (!check.can) return { ok: false, wait: check.wait };
    if (attackerId === targetId) return { ok: false, amount: 0, success: false, reason: 'self' };

    const attacker = new User(attackerId);
    const target = new User(targetId);

    await attacker.ensureExists();
    await target.ensureExists();

    const attackerBalance = await attacker.economy.getBalance();
    const targetBalance = await target.economy.getBalance();

    if (targetBalance.wallet < MIN_STEALABLE) {
        return { ok: false, amount: 0, success: false, reason: 'too_poor' };
    }
    
    const success = getRandomFloat(0, 1) < BASE_SUCCESS_CHANCE;
    const percent = randomPercentBetween(MIN_PERCENT, MAX_PERCENT);
    const rawAmount = Math.floor(targetBalance.wallet * percent);
    const amount = Math.max(1, Math.min(rawAmount, targetBalance.wallet));

    const now = Date.now();

    try {
        await dbRun('BEGIN IMMEDIATE TRANSACTION');

        await attacker.economy.setCooldown('last_robbed', now);

        if (success && amount > 0) {
            await dbRun(
                `UPDATE users SET wallet_money = wallet_money - ? WHERE user_id = ? AND wallet_money >= ?`,
                [amount, targetId, amount]
            );

            const targetAfter = await dbGet(`SELECT wallet_money FROM users WHERE user_id = ?`, [targetId]);
            const targetAfterMoney = (targetAfter && typeof targetAfter.wallet_money === 'number') ? Number(targetAfter.wallet_money) : 0;

            if (targetAfterMoney === targetBalance.wallet) {
                await dbRun('ROLLBACK');
                return { ok: false, amount: 0, success: false, reason: 'target_update_failed' };
            }

            await dbRun(
                `UPDATE users SET wallet_money = wallet_money + ? WHERE user_id = ?`,
                [amount, attackerId]
            );

            await dbRun('COMMIT');

            const percentDone = Math.round((amount / targetBalance.wallet) * 100);
            return { ok: true, amount, success: true, percent: percentDone };
        } else {
            await dbRun('COMMIT');
            return { ok: true, amount: 0, success: false, percent: 0 };
        }
    } catch (err) {
        output.err(err);
        try { await dbRun('ROLLBACK'); } catch {}
        return { ok: false, reason: 'db_error' };
    }
}

export const robCmd: Command = {
    name: 'rob',
    description: {
        main: 'Spróbuj okraść innego gracza. Kwota kradzieży bazuje na procencie pieniędzy celu.',
        short: 'Okradnij kogoś (proc.)'
    },
    flags: CommandFlags.Economy,

    permissions: {
        allowedRoles: null,
        allowedUsers: null,
        discordPerms: []
    },
    expectedArgs: [
        {
            name: 'user',
            type: 'user-mention-or-reference-msg-author',
            optional: false,
            description: 'No daj tego użytkownika, proszę...'
        }
    ],
    aliases: [],
    execute: async (api) => {
        const msg = api.msg;
        const targetArg = api.getTypedArg('user', 'user-mention-or-reference-msg-author') as CommandArgumentWithUserMentionOrMsgReferenceValue;

        if (!targetArg?.value) return msg.reply('Musisz oznaczyć osobę, którą chcesz okraść!');
        const target = targetArg.value;

        if (target.id === msg.author.id) return msg.reply('Nie możesz okraść samego siebie!');

        try {
            const result = await tryRob(msg.author.id, target.id);

            if (!result.ok) {
                if (result.wait) {
                    const waitSeconds = Math.ceil(result.wait / 1000);
                    const embed = new dsc.EmbedBuilder()
                        .setColor(PredefinedColors.Yellow)
                        .setTitle(cfg.customization.economyTexts.robbing.waitHeader)
                        .setDescription(cfg.customization.economyTexts.robbing.waitText.replaceAll('<seconds>', String(waitSeconds)));
                    return msg.reply({ embeds: [embed] });
                }

                if (result.reason === 'too_poor') {
                    const embed = new dsc.EmbedBuilder()
                        .setColor(PredefinedColors.Yellow)
                        .setTitle('Cel jest zbyt biedny')
                        .setDescription(`<@${target.id}> ma za mało pieniędzy (mniej niż ${MIN_STEALABLE} dolarów).`);
                    return msg.reply({ embeds: [embed] });
                }

                return api.log.replyError(msg, 'Coś poszło nie tak...', 'Spróbuj ponownie później.');
            }

            const embed = new dsc.EmbedBuilder()
                .setColor(result.success ? PredefinedColors.Green : PredefinedColors.Red)
                .setTitle(result.success ? 'TAAAAAAAAAAAAAAAAK!' : 'System ochrony w banku się włączył.')
                .setDescription(result.success
                    ? `Udało Ci się ukraść <@${target.id}> **${result.amount}** dolarów (${result.percent}%).`
                    : `Nie udało Ci się nic ukraść od <@${target.id}>!`
                );

            return msg.reply({ embeds: [embed] });
        } catch (error) {
            output.err(error);
            return api.log.replyError(msg, 'Coś się odwaliło...', 'Proszę, pytaj sqlite3 a nie mnie obwiniasz.');
        }
    }
};