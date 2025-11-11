import * as dsc from 'discord.js';
import { cfg } from "@/bot/cfg.js";
import { Command, CommandFlags } from "@/bot/command.js";
import { dbGet, dbRun } from "@/util/dbUtils.js";
import { PredefinedColors } from '@/util/color.js';
import { output } from '@/bot/logging.js';

export const moneyCmd: Command = {
    name: 'money',
    description: {
        main: 'Coś poszło nie tak? Naprawisz to ręcznie. Chyba...',
        short: 'Ustawia ilość pieniędzy danej osobie.'
    },
    aliases: ['moneymod', 'modeco'],
    flags: CommandFlags.Economy,

    expectedArgs: [
        {
            name: 'who',
            description: 'Na kim chcesz wykonać tą komendę?',
            type: 'user-mention-or-reference-msg-author',
            optional: false
        },
        {
            name: 'action',
            description: 'Tu powiedz co chcesz zrobić (add/set/remove)',
            type: 'string',
            optional: false
        },
        {
            name: 'amount',
            description: 'Tu powiedz na jakiej ilości hajsu chcesz to zrobić',
            type: 'string',
            optional: false
        },
        {
            name: 'location',
            description: 'A tu czy w banku czy nie. Domyślnie w portfelu. (wallet/bank)',
            type: 'string',
            optional: true
        },
    ],
    permissions: {
        discordPerms: [],
        allowedRoles: [cfg.roles.headAdmin, cfg.roles.eclair25],
        allowedUsers: []
    },

    async execute(api) {
        const msg = api.msg;
        const rawAction = api.getTypedArg('action', 'string')?.value!;
        const rawAmount = api.getTypedArg('amount', 'string')?.value!;
        const rawLocation = (api.getTypedArg('location', 'string')?.value) || 'wallet';
        const targetUser = api.getTypedArg('who', 'user-mention-or-reference-msg-author')?.value!;

        const action = rawAction?.toLowerCase();
        const location = rawLocation?.toLowerCase();

        if (!['add', 'set', 'remove'].includes(action)) {
            return api.log.replyError(api.msg, 'Nieprawidłowa akcja.', 'Użyj `add`, `set` lub `remove`.');
        }

        if (!['wallet', 'bank'].includes(location)) {
            return api.log.replyError(api.msg, 'Nieprawidłowa lokalizacja', 'Możesz użyć `wallet` lub `bank`.');
        }

        const parsed = Number(rawAmount);
        if (!Number.isFinite(parsed) || isNaN(parsed)) {
            return api.log.replyError(api.msg, 'Nieprawidłowa kwota', 'Podaj poprawną liczbę.');
        }

        const amount = Math.floor(parsed);
        if (amount < 0) return api.log.replyError(api.msg, 'Nieprawidłowa kwota', 'Nie może być ona ujemna.');

        const targetId = targetUser.id;

        let connOk = true;
        try {
            await dbRun('BEGIN TRANSACTION');

            const row = await dbGet('SELECT money, bank_money FROM economy WHERE user_id = ?', [targetId]);
            const currentMoney = row && typeof row.money === 'number' ? Number(row.money) : 0;
            const currentBank = row && typeof row.bankMoney === 'number' ? Number(row.bankMoney) : 0;

            let newMoney = currentMoney;
            let newBank = currentBank;

            if (location === 'wallet') {
                if (action === 'add') newMoney = currentMoney + amount;
                if (action === 'set') newMoney = amount;
                if (action === 'remove') newMoney = Math.max(0, currentMoney - amount);
            } else {
                if (action === 'add') newBank = currentBank + amount;
                if (action === 'set') newBank = amount;
                if (action === 'remove') newBank = Math.max(0, currentBank - amount);
            }

            await dbRun(
                `INSERT INTO economy (user_id, money, bank_money, last_worked, last_robbed, last_slutted, last_crimed)
                 VALUES (?, ?, ?, 0, 0, 0, 0)
                 ON CONFLICT(user_id) DO UPDATE SET money = excluded.money, bank_money = excluded.bank_money`,
                [targetId, newMoney, newBank]
            );

            await dbRun('COMMIT');

            const embed = new dsc.EmbedBuilder()
                .setColor(PredefinedColors.Green)
                .setTitle('Operacja zakończona!')
                .setDescription(
                    `Użytkownik: <@${targetId}>\n` +
                    `Typ: ${location === 'wallet' ? 'Portfel' : 'Bank'}\n` +
                    `Akcja: ${action}\n` +
                    `Przed: ${location === 'wallet' ? currentMoney : currentBank}\n` +
                    `Po: ${location === 'wallet' ? newMoney : newBank}`
                );

            return msg.reply({ embeds: [embed] });
        } catch (err) {
            connOk = false;
            output.err(err);
            try { await dbRun('ROLLBACK'); } catch {}
            return api.log.replyError(msg, 'Błąd bazy danych', 'Operacja nie mogła zostać zakończona.');
        }
    },
};
