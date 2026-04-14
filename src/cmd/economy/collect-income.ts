import { Command } from '@/bot/command.ts';
import { CommandFlags } from '@/bot/apis/commands/misc.ts';
import { PredefinedColors } from '@/util/color.ts';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.ts';
import { output } from '@/bot/logging.ts';

const collectIncomeCmd: Command = {
    name: 'collect-income',
    aliases: ['income', 'daily-income', 'collectincome'],
    description: {
        main: 'Odbierz swój dzienny dochód wynikający z posiadanych rang.',
        short: 'Odbiera daily income.',
    },
    flags: CommandFlags.Economy,

    expectedArgs: [],
    permissions: {
        allowedRoles: null,
        allowedUsers: null,
    },

    async execute(api) {
        const cooldownMs = 24 * 60 * 60 * 1000; // 24 hours
        const cooldownResult = await api.checkCooldown('collect-income', cooldownMs);

        if (!cooldownResult.can) {
            return api.log.replyError(
                api,
                'Jeszcze nie teraz!',
                `Możesz odebrać dochód ponownie ${cooldownResult.discordTime}.`,
            );
        }

        const actions = api.economy.getDailyIncomeActions();
        if (actions.length == 0) {
            return api.log.replyError(
                api,
                'Nie masz nic do odebrania!',
                'Nie posiadasz żadnych rang, które generują dzienny dochód. Wiem, to naprawde przykre!',
            );
        }

        try {
            const balanceBefore = await api.executor.economy.getBalance();

            await api.economy.applyDailyIncome();
            await api.executor.cooldowns.set('collect-income', Date.now());

            const balanceAfter = await api.executor.economy.getBalance();
            const earned = balanceAfter.wallet.sub(balanceBefore.wallet);

            const embed = new ReplyEmbed()
                .setColor(PredefinedColors.Green)
                .setTitle('Dochód odebrany!')
                .setDescription(
                    `Twój dzienny dochód z posiadanych rang został dodany do Twojego konta. ` +
                        `Zarobiłeś aż **${earned.format()}**!`,
                );

            return api.reply({ embeds: [embed] });
        } catch (err) {
            output.err(err);
            return api.log.replyError(
                api,
                'Błąd!',
                'Coś się jebło więc nie dostaniesz pieniędzy. Never mind.',
            );
        }
    },
};

export default collectIncomeCmd
