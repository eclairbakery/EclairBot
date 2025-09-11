import * as dsc from 'discord.js';

import { dbGet, dbRun } from '@/util/db-utils.js';
import { getRandomInt } from '@/util/rand.js';

import { PredefinedColors } from '@/util/color.js';
import { Command, CommandAPI } from '@/bot/command.js';

const COOLDOWN_MS = 30 * 1000;
const WORK_AMOUNT_MIN = 50;
const WORK_AMOUNT_MAX = 300;

async function canWork(userId: string): Promise<{ can: boolean; wait?: number }> {
    const row = await dbGet('SELECT last_worked FROM economy WHERE user_id = ?', [userId]);
    const now = Date.now();

    if (!row) return { can: true };

    const timeSinceLastWork = now - row.last_worked;
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

    await dbRun(
        `INSERT INTO economy (user_id, money, last_worked, last_robbed, last_slutted, last_crimed)
         VALUES (?, ?, ?, 0, 0, 0)
         ON CONFLICT(user_id) DO UPDATE SET money = money + ?, last_worked = ?`,
        [userId, amount, now, amount, now]
    );

    return { ok: true };
}

export const workCmd: Command = {
    name: 'work',
    aliases: [],
    description: {
        main: 'Pr\\*ca dla pana, pr\\*ca za darmo! Niewolnikiem naszym bądź... dobra, nie mam talentu do wierszy. Po prostu ekonomia.',
        short: 'Pr\\*ca dla pana, pr\\*ca za darmo!',
    },

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

                return api.msg.reply({ embeds: [embed] });
            }

            const embed = new dsc.EmbedBuilder()
                .setColor(PredefinedColors.Blue)
                .setTitle('Yay!')
                .setDescription(`Zarobiłeś **${amount}** dolarów!`);

            return api.msg.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);

            const embed = new dsc.EmbedBuilder()
                .setColor(PredefinedColors.Red)
                .setTitle('Błąd')
                .setDescription('Coś się złego odwaliło z tą ekonomią...')
                .setTimestamp();

            return api.msg.reply({ embeds: [embed] });
        }
    }
};
