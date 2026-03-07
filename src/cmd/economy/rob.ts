import { db } from '@/bot/apis/db/bot-db.js';
import { getRandomFloat } from '@/util/math/rand.js';

import { Command, CommandArgumentWithUserMentionOrMsgReferenceValue, CommandFlags } from '@/bot/command.js';
import { PredefinedColors } from '@/util/color.js';
import { output } from '@/bot/logging.js';
import { cfg } from '@/bot/cfg.js';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.js';

import User from '@/bot/apis/db/user.js';

const CooldownMs = 5 * 60 * 1000;
const BaseSuccessChance = 0.5;
const MinPercent = 0.05;
const MaxPercent = 0.25;
const MinStealable = 50;

function randomPercentBetween(min: number, max: number): number {
    return getRandomFloat(min, max);
}

async function tryRob(attacker: User, target: User): Promise<{ ok: boolean; amount?: number; success?: boolean; percent?: number; reason?: string }> {
    if (attacker.id === target.id) return { ok: false, amount: 0, success: false, reason: 'self' };

    await attacker.ensureExists();
    await target.ensureExists();

    const targetBalance = await target.economy.getBalance();

    if (targetBalance.wallet < MinStealable) {
        return { ok: false, amount: 0, success: false, reason: 'too_poor' };
    }

    const success = getRandomFloat(0, 1) < BaseSuccessChance;
    const percent = randomPercentBetween(MinPercent, MaxPercent);
    const rawAmount = Math.floor(targetBalance.wallet * percent);
    const amount = Math.max(1, Math.min(rawAmount, targetBalance.wallet));

    try {
        await db.runSql('BEGIN IMMEDIATE TRANSACTION');

        await attacker.cooldowns.set('rob', Date.now());

        if (success && amount > 0) {
            await db.runSql(
                `UPDATE users SET wallet_money = wallet_money - ? WHERE user_id = ? AND wallet_money >= ?`,
                [amount, target.id, amount]
            );

            const targetAfter = await db.selectOne(`SELECT wallet_money FROM users WHERE user_id = ?`, [target.id]);
            const targetAfterMoney = (targetAfter && typeof targetAfter.wallet_money === 'number') ? Number(targetAfter.wallet_money) : 0;

            if (targetAfterMoney === targetBalance.wallet) {
                await db.runSql('ROLLBACK');
                return { ok: false, amount: 0, success: false, reason: 'target_update_failed' };
            }

            await db.runSql(
                `UPDATE users SET wallet_money = wallet_money + ? WHERE user_id = ?`,
                [amount, attacker.id]
            );

            await db.runSql('COMMIT');

            const percentDone = Math.round((amount / targetBalance.wallet) * 100);
            return { ok: true, amount, success: true, percent: percentDone };
        } else {
            await db.runSql('COMMIT');
            return { ok: true, amount: 0, success: false, percent: 0 };
        }
    } catch (err) {
        output.err(err);
        try { await db.runSql('ROLLBACK'); } catch {}
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
        allowedUsers: null
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
        const targetArg = api.getTypedArg('user', 'user-mention-or-reference-msg-author') as CommandArgumentWithUserMentionOrMsgReferenceValue;

        if (!targetArg?.value) return api.reply('Musisz oznaczyć osobę, którą chcesz okraść!');
        const targetMember = targetArg.value;

        if (targetMember.id === api.invoker.id) return api.reply('Nie możesz okraść samego siebie!');

        try {
            const cooldownResult = await api.checkCooldown('rob', CooldownMs);
            if (!cooldownResult.can) {
                const embed = new ReplyEmbed()
                    .setColor(PredefinedColors.Yellow)
                    .setTitle(cfg.customization.economyTexts.robbing.waitHeader)
                    .setDescription(cfg.customization.economyTexts.robbing.waitText.replaceAll('<seconds>', cooldownResult.discordTime));
                return api.reply({ embeds: [embed] });
            }

            const target = new User(targetMember.id);
            const result = await tryRob(api.executor, target);

            if (!result.ok) {
                if (result.reason === 'too_poor') {
                    const embed = new ReplyEmbed()
                        .setColor(PredefinedColors.Yellow)
                        .setTitle('Cel jest zbyt biedny')
                        .setDescription(`<@${targetMember.id}> ma za mało pieniędzy (mniej niż ${MinStealable} dolarów).`);
                    return api.reply({ embeds: [embed] });
                }

                return api.log.replyError(api, 'Coś poszło nie tak...', 'Spróbuj ponownie później.');
            }

            const embed = new ReplyEmbed()
                .setColor(result.success ? PredefinedColors.Green : PredefinedColors.Red)
                .setTitle(result.success ? 'TAAAAAAAAAAAAAAAAK!' : 'System ochrony w banku się włączył.')
                .setDescription(result.success
                    ? `Udało Ci się ukraść <@${targetMember.id}> **${result.amount}** dolarów (${result.percent}%).`
                    : `Nie udało Ci się nic ukraść od <@${targetMember.id}>!`
                );

            return api.reply({ embeds: [embed] });
        } catch (error) {
            output.err(error);
            return api.log.replyError(api, 'Coś się odwaliło...', 'Proszę, pytaj sqlite3 a nie mnie obwiniasz.');
        }
    }
};
