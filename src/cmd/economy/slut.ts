import { Command } from '../../bot/command';

import * as dsc from 'discord.js';
import { PredefinedColors } from '../../util/color';
import { dbGet, dbRun, getRandomInt } from '../../bot/shared';

const COOLDOWN_MS = 2 * 60 * 1000;
const WORK_AMOUNT_MIN = 500;
const WORK_AMOUNT_MAX = 1600;
const PERCENTAGE = 0.6;

async function canSlut(userId: string): Promise<{ can: boolean; wait?: number }> {
    const row = await dbGet('SELECT last_slutted FROM economy WHERE user_id = ?', [userId]);
    const now = Date.now();

    if (!row) return { can: true };

    const timeSinceLastWork = now - row.last_worked;
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
         ON CONFLICT(user_id) DO UPDATE SET money = money ${success ? '+' : '-'} ?, last_slutted = ?`,
        [userId, amount, now, amount, now]
    );

    return { ok: true };
}

export const slutCmd: Command = {
    name: 'slut',
    desc: 'Któżby się spodziewał, że będziesz pracować dorywczo?',
    category: 'ekonomia',
    expectedArgs: [],

    aliases: [],
    allowedRoles: null,
    allowedUsers: [],

    async execute(msg, args) {
        try {
            let amount = getRandomInt(WORK_AMOUNT_MIN, WORK_AMOUNT_MAX);
            let win = Math.random() < PERCENTAGE;
            const result = await trySlut(msg.author.id, amount, win);

            if (!result.ok) {
                const waitSeconds = Math.ceil((result.wait ?? 0) / 1000);

                const embed = new dsc.EmbedBuilder()
                    .setColor(PredefinedColors.Yellow)
                    .setTitle('Chwila przerwy!')
                    .setDescription(`Ktoś tam Ci każe czekać **${waitSeconds}** sekund zanim znowu popr*cujesz, żebyś nie naspamił komendami w chuja hajsu...`)

                return msg.reply({ embeds: [embed] });
            }

            let embed: dsc.EmbedBuilder;

            if (win) embed = new dsc.EmbedBuilder()
                .setColor(PredefinedColors.Blue)
                .setTitle('Yay!')
                .setDescription(`Praca dorywcza dała Ci *prawie* darmowe **${amount}** dolarów!`)
            else embed = new dsc.EmbedBuilder()
                .setColor(PredefinedColors.Red)
                .setTitle('Niestety, nie tym razem...')
                .setDescription(`Straciłeś **${amount}** dolarów!`)

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