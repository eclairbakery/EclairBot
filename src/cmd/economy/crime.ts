import { getRandomInt } from '@/util/math/rand.js';

import { Command, CommandFlags } from '@/bot/command.js';
import { PredefinedColors } from '@/util/color.js';
import { output } from '@/bot/logging.js';
import { cfg } from '@/bot/cfg.js';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.js';

const CrimeAmountMin = cfg.commands.economy.crime.minimumCrimeAmount;
const CrimeAmountMax = cfg.commands.economy.crime.maximumCrimeAmount;
const Percentage = cfg.commands.economy.crime.successRatio;
const Cooldown = cfg.commands.economy.crime.cooldown;

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
            const result = await api.checkCooldown('crime', Cooldown);
            if (!result.can) {
                const embed = new ReplyEmbed()
                    .setColor(PredefinedColors.Yellow)
                    .setTitle(cfg.customization.economyTexts.workSlutOrCrime.crime.waitTextHeader)
                    .setDescription(cfg.customization.economyTexts.workSlutOrCrime.crime.waitTextDescription.replaceAll('<seconds>', result.discordTime));
                return api.reply({ embeds: [embed] });
            }

            const amount = getRandomInt(CrimeAmountMin, CrimeAmountMax);
            const win = Math.random() < Percentage;

            if (win) await api.executor.economy.addWalletMoney(amount);
            else await api.executor.economy.deductWalletMoney(amount);
            
            await api.executor.cooldowns.set('crime', Date.now());

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
