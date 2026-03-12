import { db } from '@/bot/apis/db/bot-db.js';
import { getRandomFloat } from '@/util/math/rand.js';

import { Command, CommandFlags } from '@/bot/command.js';
import { PredefinedColors } from '@/util/color.js';
import { output } from '@/bot/logging.js';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.js';
import Money from '@/util/money.js';

import User from '@/bot/apis/db/user.js';

const CooldownMs = 5 * 60 * 1000;
const BaseSuccessChance = 0.5;
const MinPercent = 0.05;
const MaxPercent = 0.25;
const MinStealable = Money.fromDollars(50);

function randomPercentBetween(min: number, max: number): number {
    return getRandomFloat(min, max);
}

async function tryRob(attacker: User, target: User): Promise<{ ok: boolean; amount?: Money; success?: boolean; percent?: number; reason?: string }> {
    if (attacker.id === target.id) return { ok: false, reason: 'self' };

    await attacker.ensureExists();
    await target.ensureExists();

    const targetBalance = await target.economy.getBalance();

    if (targetBalance.wallet.lessThan(MinStealable)) {
        return { ok: false, reason: 'too_poor' };
    }

    const success = getRandomFloat(0, 1) < BaseSuccessChance;
    const percent = randomPercentBetween(MinPercent, MaxPercent);
    
    const amountCents = (targetBalance.wallet.asCents() * BigInt(Math.round(percent * 100))) / 100n;
    const amount = Money.fromCents(amountCents < 1n ? 1n : amountCents);

    try {
        await db.runSql('BEGIN IMMEDIATE TRANSACTION');

        await attacker.cooldowns.set('rob', Date.now());

        if (success && amount.isPositive()) {
            const result = await target.economy.deductWalletMoney(amount);
            
            if (result.changes === 0) {
                await db.runSql('ROLLBACK');
                return { ok: false, reason: 'target_update_failed' };
            }

            await attacker.economy.addWalletMoney(amount);
            await db.runSql('COMMIT');

            const percentDone = Number((amount.asCents() * 100n) / targetBalance.wallet.asCents());
            return { ok: true, amount, success: true, percent: percentDone };
        } else {
            await db.runSql('COMMIT');
            return { ok: true, amount: Money.zero(), success: false, percent: 0 };
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
            type: { base: 'user-mention', includeRefMessageAuthor: true },
            optional: false,
            description: 'No daj tego użytkownika, proszę...'
        }
    ],
    aliases: [],
    execute: async (api) => {
        const targetMember = api.getTypedArg('user', 'user-mention').value;

        if (!targetMember) return api.reply('Musisz oznaczyć osobę, którą chcesz okraść!');

        if (targetMember.id === api.invoker.id) return api.reply('Nie możesz okraść samego siebie!');

        try {
            const cooldownResult = await api.checkCooldown('rob', CooldownMs);
            if (!cooldownResult.can) {
                const embed = new ReplyEmbed()
                    .setColor(PredefinedColors.Yellow)
                    .setTitle('Chwila przerwy!')
                    .setDescription(`Musisz poczekać **<seconds> sekund** zanim spróbujesz znowu okraść kogoś.`.replaceAll('<seconds>', cooldownResult.discordTime));
                return api.reply({ embeds: [embed] });
            }

            const target = new User(targetMember.id);
            const result = await tryRob(api.executor, target);

            if (!result.ok) {
                if (result.reason === 'too_poor') {
                    const embed = new ReplyEmbed()
                        .setColor(PredefinedColors.Yellow)
                        .setTitle('Cel jest zbyt biedny')
                        .setDescription(`<@${targetMember.id}> ma za mało pieniędzy (mniej niż ${MinStealable.format()}).`);
                    return api.reply({ embeds: [embed] });
                }

                return api.log.replyError(api, 'Coś poszło nie tak...', 'Spróbuj ponownie później.');
            }

            const embed = new ReplyEmbed()
                .setColor(result.success ? PredefinedColors.Green : PredefinedColors.Red)
                .setTitle(result.success ? 'TAAAAAAAAAAAAAAAAK!' : 'System ochrony w banku się włączył.')
                .setDescription(result.success
                    ? `Udało Ci się ukraść <@${targetMember.id}> **${result.amount?.format()}** (${result.percent}%).`
                    : `Nie udało Ci się nic ukraść od <@${targetMember.id}>!`
                );

            return api.reply({ embeds: [embed] });
        } catch (error) {
            output.err(error);
            return api.log.replyError(api, 'Coś się odwaliło...', 'Proszę, pytaj sqlite3 a nie mnie obwiniasz.');
        }
    }
};
