import * as dsc from 'discord.js';

import { dbGet, dbRun } from '@/util/db-utils.js';
import { getRandomInt } from '@/util/rand.js';

import { Command, CommandFlags } from '@/bot/command.js';
import { PredefinedColors } from '@/util/color.js';

const COOLDOWN_MS = 15 * 60 * 1000;
const WORK_AMOUNT_MIN = 2500;
const WORK_AMOUNT_MAX = 8000;
const PERCENTAGE = 0.4;

async function canSlut(userId: string): Promise<{ can: boolean; wait?: number }> {
    const row = await dbGet('SELECT last_crimed FROM economy WHERE user_id = ?', [userId]);
    const now = Date.now();

    if (!row) return { can: true };

    const timeSinceLastWork = now - row.last_crimed;
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

    await dbRun(
        `INSERT INTO economy (user_id, money, last_worked, last_robbed, last_slutted, last_crimed)
         VALUES (?, ?, ?, 0, 0, 0)
         ON CONFLICT(user_id) DO UPDATE SET money = money ${success ? '+' : '-'} ?, last_crimed = ?`,
        [userId, amount, now, amount, now]
    );

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
        allowedUsers: null,
        discordPerms: []
    },
    expectedArgs: [],
    aliases: [],

    async execute(api) {
        const msg = api.msg;
        try {
            const amount = getRandomInt(WORK_AMOUNT_MIN, WORK_AMOUNT_MAX);
            const win = Math.random() < PERCENTAGE;

            const result = await trySlut(msg.author.id, amount, win);

            if (!result.ok) {
                const waitSeconds = Math.ceil((result.wait ?? 0) / 1000);
                const embed = new dsc.EmbedBuilder()
                    .setColor(PredefinedColors.Yellow)
                    .setTitle('Chwila przerwy!')
                    .setDescription(`Musisz odczekać **${waitSeconds}** sekund zanim znowu popełnisz przestępstwo.`);
                return msg.reply({ embeds: [embed] });
            }

            const embed = new dsc.EmbedBuilder()
                .setColor(win ? PredefinedColors.Blue : PredefinedColors.Red)
                .setTitle(win ? 'Yay!' : 'Przestępstwo nie zawsze się opłaca...')
                .setDescription(win
                    ? `Popełniłeś przestępstwo i zarobiłeś **${amount}** dolarów!`
                    : `Straciłeś **${amount}** dolarów, ponieważ musiałeś zapłacić mandat!`
                );

            return msg.reply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            const embed = new dsc.EmbedBuilder()
                .setColor(PredefinedColors.Red)
                .setTitle('Błąd')
                .setDescription('Coś się złego odwaliło z tą ekonomią...')
                .setTimestamp();
            return msg.reply({ embeds: [embed] });
        }
    }
};
