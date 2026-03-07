import { getRandomInt } from '@/util/math/rand.js';

import { PredefinedColors } from '@/util/color.js';
import { Command, CommandAPI, CommandFlags } from '@/bot/command.js';
import { output } from '@/bot/logging.js';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.js';

const CooldownMs = 10 * 1000;
const WorkAmountMin = 50;
const WorkAmountMax = 300;

export const workCmd: Command = {
    name: 'work',
    aliases: [],
    description: {
        main: 'Pr\\*ca dla pana, pr\\*ca za darmo! Niewolnikiem naszym bądź... dobra, nie mam talentu do wierszy. Po prostu ekonomia.',
        short: 'Pr\\*ca dla pana, pr\\*ca za darmo!',
    },
    flags: CommandFlags.Economy,

    permissions: {
        allowedRoles: null,
        allowedUsers: null,
    },
    expectedArgs: [],

    async execute(api: CommandAPI) {
        try {
            const result = await api.checkCooldown('work', CooldownMs);
            if (!result.can) {
                const embed = new ReplyEmbed()
                    .setColor(PredefinedColors.Yellow)
                    .setTitle('Chwila przerwy!')
                    .setDescription(`Ktoś tam Ci każe czekać ${result.discordTime} sekund zanim znowu popr*cujesz, żebyś nie naspamił komendami w chuja hajsu...`);

                return api.reply({ embeds: [embed] });
            }

            const amount = getRandomInt(WorkAmountMin, WorkAmountMax);
            
            await api.executor.economy.addWalletMoney(amount);
            await api.executor.cooldowns.set('work', Date.now());

            const embed = new ReplyEmbed()
                .setColor(PredefinedColors.Blue)
                .setTitle('Yay!')
                .setDescription(`Zarobiłeś **${amount}** dolarów!`);

            return api.reply({ embeds: [embed] });
        } catch (err) {
            output.err(err);

            const embed = new ReplyEmbed()
                .setColor(PredefinedColors.Red)
                .setTitle('Błąd')
                .setDescription('Coś się złego odwaliło z tą ekonomią...')
                .setTimestamp();

            return api.reply({ embeds: [embed] });
        }
    }
};
