import { getRandomInt } from '@/util/math/rand.js';

import { Command, CommandFlags } from '@/bot/command.js';
import { PredefinedColors } from '@/util/color.js';
import { output } from '@/bot/logging.js';
import { formatMoney } from '@/util/math/format.js';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.js';

const CooldownMs = 2 * 60 * 1000;
const SlutAmountMin = 500;
const SlutAmountMax = 1600;
const Percentage = 0.6;

export const slutCmd: Command = {
    name: 'slut',
    aliases: [],
    description: {
        main: 'Któżby się spodziewał, że będziesz pracować dorywczo?',
        short: 'Któżby się spodziewał, że będziesz pracować dorywczo?',
    },
    flags: CommandFlags.Economy,

    expectedArgs: [],
    permissions: {
        allowedRoles: null,
        allowedUsers: [],
    },

    async execute(api) {
        try {
            const result = await api.checkCooldown('slut', CooldownMs);
            if (!result.can) {
                const embed = new ReplyEmbed()
                    .setColor(PredefinedColors.Yellow)
                    .setTitle('Chwila przerwy!')
                    .setDescription(`Ktoś tam Ci każe czekać ${result.discordTime} sekund zanim znowu popr*cujesz dorywczo, żebyś nie naspamił komendami w chuja hajsu...`);

                return api.reply({ embeds: [embed] });
            }

            const amount = getRandomInt(SlutAmountMin, SlutAmountMax);
            const win = Math.random() < Percentage;
            
            const multiplier = api.economy.getMultiplier('slut');
            const total = win ? (amount * multiplier) : amount;

            if (win) await api.executor.economy.addWalletMoney(total);
            else await api.executor.economy.deductWalletMoney(total);
            
            await api.executor.cooldowns.set('slut', Date.now());

            let embed: ReplyEmbed;

            if (win) {
                embed = new ReplyEmbed()
                    .setColor(PredefinedColors.Blue)
                    .setTitle('Yay!')
                    .setDescription(`Praca dorywcza dała Ci *prawie* darmowe **${formatMoney(total)}**!`);
            } else {
                embed = new ReplyEmbed()
                    .setColor(PredefinedColors.Red)
                    .setTitle('Niestety, nie tym razem...')
                    .setDescription(`Straciłeś **${formatMoney(total)}**!`);
            }

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
    },
};
