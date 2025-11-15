import * as dsc from 'discord.js';

import { getRandomInt } from '@/util/rand.js';

import { PredefinedColors } from '@/util/color.js';
import { Command, CommandAPI, CommandFlags } from '@/bot/command.js';
import { output } from '@/bot/logging.js';
import User from '@/bot/apis/db/user.js';

const COOLDOWN_MS = 10 * 1000;
const WORK_AMOUNT_MIN = 50;
const WORK_AMOUNT_MAX = 300;

async function canWork(userId: string): Promise<{ can: boolean; wait?: number }> {
    const row = await (new User(userId)).economy.getCooldowns();
    const now = Date.now();

    if (!row) return { can: true };

    const timeSinceLastWork = now - (row.lastWorked ?? 0);
    if (timeSinceLastWork < COOLDOWN_MS) {
        return { can: false, wait: COOLDOWN_MS - timeSinceLastWork };
    }

    return { can: true };
}

async function tryWork(userId: string, amount: number): Promise<{ ok: boolean; wait?: number }> {
    const check = await canWork(userId);

    if (!check.can) {
        return { ok: false, wait: check.wait };
    }

    const now = Date.now();

    await (new User(userId)).economy.addWalletMoney(amount);
    await (new User(userId)).economy.setCooldown('last_worked', now);

    return { ok: true };
}

export const workCmd: Command = {
    name: 'work',
    aliases: [],
    description: {
        main: 'Pr\\*ca dla pana, pr\\*ca za darmo! Niewolnikiem naszym bądź... dobra, nie mam talentu do wierszy. Po prostu ekonomia.',
        short: 'Pr\\*ca dla pana, pr\\*ca za darmo!',
    },
    flags: CommandFlags.Economy,

    permissions: {
        discordPerms: null,
        allowedRoles: null,
        allowedUsers: null,
    },
    expectedArgs: [],

    async execute(api: CommandAPI) {
        try {
            const amount = getRandomInt(WORK_AMOUNT_MIN, WORK_AMOUNT_MAX);
            const result = await tryWork(api.msg.author.id, amount);

            if (!result.ok) {
                const waitSeconds = Math.ceil((result.wait ?? 0) / 1000);

                const embed = new dsc.EmbedBuilder()
                    .setColor(PredefinedColors.Yellow)
                    .setTitle('Chwila przerwy!')
                    .setDescription(`Ktoś tam Ci każe czekać **${waitSeconds}** sekund zanim znowu popr*cujesz, żebyś nie naspamił komendami w chuja hajsu...`);

                return api.reply({ embeds: [embed] });
            }

            const embed = new dsc.EmbedBuilder()
                .setColor(PredefinedColors.Blue)
                .setTitle('Yay!')
                .setDescription(`Zarobiłeś **${amount}** dolarów!`);

            return api.reply({ embeds: [embed] });
        } catch (error) {
            output.err(error);

            const embed = new dsc.EmbedBuilder()
                .setColor(PredefinedColors.Red)
                .setTitle('Błąd')
                .setDescription('Coś się złego odwaliło z tą ekonomią...')
                .setTimestamp();

            return api.reply({ embeds: [embed] });
        }
    }
};
