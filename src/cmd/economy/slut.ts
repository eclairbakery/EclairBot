import * as dsc from 'discord.js';

import { getRandomInt } from '@/util/math/rand.js';

import { Command, CommandFlags } from '@/bot/command.js';
import { PredefinedColors } from '@/util/color.js';
import { output } from '@/bot/logging.js';
import { formatMoney } from '@/util/math/format.js';
import User from '@/bot/apis/db/user.js';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.js';

const COOLDOWN_MS = 2 * 60 * 1000;
const WORK_AMOUNT_MIN = 500;
const WORK_AMOUNT_MAX = 1600;
const PERCENTAGE = 0.6;

async function canSlut(userId: string): Promise<{ can: boolean; wait?: number }> {
    const row = await (new User(userId)).economy.getCooldowns();
    const now = Date.now();

    if (!row) return { can: true };

    const timeSinceLastWork = now - (row.lastSlutted ?? 0);
    if (timeSinceLastWork < COOLDOWN_MS) {
        return { can: false, wait: COOLDOWN_MS - timeSinceLastWork };
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
    await (new User(userId)).economy.setCooldown('last_slutted', now);

    return { ok: true };
}

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
            let amount = getRandomInt(WORK_AMOUNT_MIN, WORK_AMOUNT_MAX);
            let win = Math.random() < PERCENTAGE;
            const result = await trySlut(api.invoker.id, amount, win);

            if (!result.ok) {
                const waitSeconds = Math.ceil((result.wait ?? 0) / 1000);

                const embed = new ReplyEmbed()
                    .setColor(PredefinedColors.Yellow)
                    .setTitle('Chwila przerwy!')
                    .setDescription(`Ktoś tam Ci każe czekać **${waitSeconds}** sekund zanim znowu popr*cujesz, żebyś nie naspamił komendami w chuja hajsu...`);

                return api.reply({ embeds: [embed] });
            }

            let embed: ReplyEmbed;

            if (win) {
                embed = new ReplyEmbed()
                    .setColor(PredefinedColors.Blue)
                    .setTitle('Yay!')
                    .setDescription(`Praca dorywcza dała Ci *prawie* darmowe **${formatMoney(amount)}**!`);
            } else {
                embed = new ReplyEmbed()
                    .setColor(PredefinedColors.Red)
                    .setTitle('Niestety, nie tym razem...')
                    .setDescription(`Straciłeś **${formatMoney(amount)}**!`);
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
