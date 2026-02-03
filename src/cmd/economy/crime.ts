import * as dsc from 'discord.js';

import { getRandomInt } from '@/util/math/rand.js';

import { Command, CommandFlags } from '@/bot/command.js';
import { PredefinedColors } from '@/util/color.js';
import { output } from '@/bot/logging.js';
import { cfg } from '@/bot/cfg.js';
import User from '@/bot/apis/db/user.js';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.js';

const WORK_AMOUNT_MIN = cfg.features.economy.commandSettings.crime.minimumCrimeAmount;
const WORK_AMOUNT_MAX = cfg.features.economy.commandSettings.crime.maximumCrimeAmount;
const PERCENTAGE = cfg.features.economy.commandSettings.crime.successRatio;

async function canSlut(userId: string): Promise<{ can: boolean; wait?: number }> {
    const row = await (new User(userId)).economy.getCooldowns();
    const now = Date.now();

    if (!row) return { can: true };

    const timeSinceLastWork = now - (row.lastCrimed ?? 0);
    if (timeSinceLastWork < cfg.features.economy.commandSettings.crime.cooldown) {
        return { can: false, wait: cfg.features.economy.commandSettings.crime.cooldown - timeSinceLastWork };
    }

    return { can: true };
}

async function trySlut(userId: string, amount: number, success: boolean): Promise<{ ok: boolean; wait?: number }> {
    const check = await canSlut(userId);

    if (!check.can) {
        return { ok: false, wait: check.wait };
    }

    const now = Date.now();

    if (success) await (new User(userId)).economy.addWalletMoney(amount);
            else await (new User(userId)).economy.deductWalletMoney(amount);
    await (new User(userId)).economy.setCooldown('last_crimed', now);

    return { ok: true };
}

export const crimeCmd: Command = {
    name: 'crime',
    description: {
        main: 'Ohohohoho! Mamy na serwerze przestępców. Możesz popełnić przestępstwo i wygrać albo przegrać kasę!',
        short: 'Sprawdź swoje szczęście w kryminalnym świecie.'
    },
    flags: CommandFlags.Economy,

    permissions: {
        allowedRoles: null,
        allowedUsers: null
    },
    expectedArgs: [],
    aliases: [],

    async execute(api) {
        if (((await api.executor.economy.getBalance()).wallet ?? 0) <= 100) {
            const embed = new ReplyEmbed()
                .setColor(PredefinedColors.DarkBlue)
                .setTitle(cfg.customization.economyTexts.workSlutOrCrime.crime.crimeNotAllowedHeader)
                .setDescription(cfg.customization.economyTexts.workSlutOrCrime.crime.crimeNotAllowedText);
            return api.reply({ embeds: [embed] });
        }

        try {
            const amount = getRandomInt(WORK_AMOUNT_MIN, WORK_AMOUNT_MAX);
            const win = Math.random() < PERCENTAGE;

            const result = await trySlut(api.invoker.id, amount, win);

            if (!result.ok) {
                const waitSeconds = Math.ceil((result.wait ?? 0) / 1000);
                const embed = new ReplyEmbed()
                    .setColor(PredefinedColors.Yellow)
                    .setTitle(cfg.customization.economyTexts.workSlutOrCrime.crime.waitTextHeader)
                    .setDescription(cfg.customization.economyTexts.workSlutOrCrime.crime.waitTextDescription.replaceAll('<seconds>', String(waitSeconds)));
                return api.reply({ embeds: [embed] });
            }

            const embed = new ReplyEmbed()
                .setColor(win ? PredefinedColors.Blue : PredefinedColors.Red)
                .setTitle(win ? cfg.customization.economyTexts.workSlutOrCrime.crime.winHeader : cfg.customization.economyTexts.workSlutOrCrime.crime.loseHeader)
                .setDescription((win
                    ? cfg.customization.economyTexts.workSlutOrCrime.crime.winText
                    : cfg.customization.economyTexts.workSlutOrCrime.crime.loseText
                ).replaceAll('<amount>', String(amount)));

            return api.reply({ embeds: [embed] });

        } catch (error) {
            output.err(error);
            const embed = new ReplyEmbed()
                .setColor(PredefinedColors.Red)
                .setTitle('Błąd')
                .setDescription('Coś się złego odwaliło z tą ekonomią...')
                .setTimestamp();
            return api.reply({ embeds: [embed] });
        }
    }
};
