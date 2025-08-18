import { Command } from '../../bot/command.js';
import * as dsc from 'discord.js';
import { PredefinedColors } from '../../util/color.js';
import { dbGet, dbRun, getRandomInt } from '../../bot/shared.js';
import { replyError } from '../../util/log.js';

const COOLDOWN_MS = 5 * 60 * 1000; // 5 minut między kradzieżami
const ROB_PERCENTAGE = 0.5; // 50% szans na sukces
const ROB_AMOUNT_MIN = 200;
const ROB_AMOUNT_MAX = 1200;

async function canRob(userId: string): Promise<{ can: boolean; wait?: number }> {
    const row = await dbGet('SELECT last_robbed FROM economy WHERE user_id = ?', [userId]);
    const now = Date.now();

    if (!row) return { can: true };

    const timeSinceLastRob = now - row.last_robbed;
    if (timeSinceLastRob < COOLDOWN_MS) {
        return { can: false, wait: COOLDOWN_MS - timeSinceLastRob };
    }

    return { can: true };
}

async function tryRob(userId: string, targetId: string): Promise<{ ok: boolean; amount?: number; wait?: number; success?: boolean }> {
    const check = await canRob(userId);
    if (!check.can) return { ok: false, wait: check.wait };

    const targetRow = await dbGet('SELECT money FROM economy WHERE user_id = ?', [targetId]);
    if (!targetRow || targetRow.money <= 0) return { ok: false, amount: 0, success: false };

    const success = Math.random() < ROB_PERCENTAGE;
    const amount = getRandomInt(ROB_AMOUNT_MIN, ROB_AMOUNT_MAX);

    const robbedAmount = success ? Math.min(amount, targetRow.money) : 0;

    const now = Date.now();
    await dbRun(
        `INSERT INTO economy (user_id, money, last_worked, last_robbed, last_slutted, last_crimed)
         VALUES (?, ?, 0, ?, 0, 0)
         ON CONFLICT(user_id) DO UPDATE SET money = money + ?, last_robbed = ?`,
        [userId, robbedAmount, now, robbedAmount, now]
    );

    if (success) {
        await dbRun(
            'UPDATE economy SET money = money - ? WHERE user_id = ?',
            [robbedAmount, targetId]
        );
    }

    return { ok: true, amount: robbedAmount, success };
}

export const robCmd: Command = {
    name: 'rob',
    longDesc: 'Spróbuj okraść innego gracza i zgarnąć trochę hajsu. Ale nie miej potem wyrzutów sumienia...',
    shortDesc: 'Okradnij kogoś!',
    expectedArgs: [{
        name: 'user',
        desc: ''
    }],

    aliases: [],
    allowedRoles: null,
    allowedUsers: [],

    async execute(msg, args) {
        try {
            const target = msg.mentions.users.first();
            if (!target) return msg.reply('Musisz oznaczyć osobę, którą chcesz okraść!');

            if (target.id === msg.author.id) return msg.reply('Nie możesz okraść samego siebie!');

            const result = await tryRob(msg.author.id, target.id);

            if (!result.ok) {
                if (result.wait) {
                    const waitSeconds = Math.ceil(result.wait / 1000);
                    return msg.reply({ embeds: [new dsc.EmbedBuilder()
                        .setColor(PredefinedColors.Yellow)
                        .setTitle('Chwila przerwy!')
                        .setDescription(`Musisz poczekać **${waitSeconds} sekund** zanim spróbujesz znowu okraść kogoś.`)
                    ]});
                } else {
                    throw new Error('tak');
                }
            }

            const embed = new dsc.EmbedBuilder()
                .setColor(result.success ? PredefinedColors.Green : PredefinedColors.Red)
                .setTitle(result.success ? 'TAAAAAAAAAAAAAAAAK!' : 'System ochrony w banku się włączył.')
                .setDescription(result.success
                    ? `Udało Ci się okraść <@${target.id}> i zgarnąć **${result.amount}** dolarów!`
                    : `Nie udało Ci się nic ukraść od <@${target.id}>!`
                );

            return msg.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);

            return replyError(msg, 'Coś się odwaliło...', 'Proszę, pytaj sqlite3 a nie mnie obwiniasz.');
        }
    }
};