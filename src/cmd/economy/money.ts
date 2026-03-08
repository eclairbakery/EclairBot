import { cfg } from "@/bot/cfg.js";
import { db } from '@/bot/apis/db/bot-db.js';
import User from "@/bot/apis/db/user.js";
import { Command, CommandFlags } from "@/bot/command.js";
import { PredefinedColors } from '@/util/color.js';
import { output } from '@/bot/logging.js';
import { formatMoney } from '@/util/math/format.js';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.js';

export const moneyCmd: Command = {
    name: 'money',
    description: {
        main: 'Coś poszło nie tak? Naprawisz to ręcznie. Chyba...',
        short: 'Ustawia ilość pieniędzy danej osobie.'
    },
    aliases: ['moneymod', 'modeco'],
    flags: CommandFlags.Economy | CommandFlags.Unsafe,

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
            type: 'number',
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
        allowedRoles: [cfg.roles.headAdmin, cfg.roles.eclair25],
        allowedUsers: []
    },

    async execute(api) {
        const rawAction = api.getTypedArg('action', 'string')?.value!;
        const amount = api.getTypedArg('amount', 'number')?.value!;
        const rawLocation = (api.getTypedArg('location', 'string')?.value) || 'wallet';
        const targetMember = api.getTypedArg('who', 'user-mention-or-reference-msg-author')?.value!;

        const action = rawAction?.toLowerCase();
        const location = rawLocation?.toLowerCase();

        if (!['add', 'set', 'remove'].includes(action)) {
            return api.log.replyError(api, 'Nieprawidłowa akcja.', 'Użyj `add`, `set` lub `remove`.');
        }

        if (!['wallet', 'bank'].includes(location)) {
            return api.log.replyError(api, 'Nieprawidłowa lokalizacja', 'Możesz użyć `wallet` lub `bank`.');
        }

        if (amount < 0) return api.log.replyError(api, 'Nieprawidłowa kwota', 'Nie może być ona ujemna.');

        const targetId = targetMember.id;
        const targetUser = new User(targetId);

        try {
            let currentMoney: number, currentBank: number, newMoney: number, newBank: number;

            await db.transaction(async () => {
                const bal = await targetUser.economy.getBalance();
                currentMoney = bal.wallet;
                currentBank = bal.bank;

                newMoney = currentMoney;
                newBank = currentBank;

                if (location === 'wallet') {
                    if (action === 'add') newMoney = currentMoney + amount;
                    if (action === 'set') newMoney = amount;
                    if (action === 'remove') newMoney = Math.max(0, currentMoney - amount);
                } else {
                    if (action === 'add') newBank = currentBank + amount;
                    if (action === 'set') newBank = amount;
                    if (action === 'remove') newBank = Math.max(0, currentBank - amount);
                }

                await targetUser.economy.setBalance({
                    bank: newBank,
                    wallet: newMoney
                });
            });

            return api.reply({
                embeds: [
                    new ReplyEmbed()
                        .setColor(PredefinedColors.Green)
                        .setTitle('Operacja zakończona!')
                        .setDescription([
                            `Użytkownik: <@${targetId}>`,
                            `Typ: ${location == 'wallet' ? 'Portfel' : 'Bank'}`,
                            `Akcja: ${action}`,
                            `Przed: ${formatMoney(location == 'wallet' ? currentMoney! : currentBank!)}`,
                            `Po: ${formatMoney(location == 'wallet' ? newMoney! : newBank!)}`,
                        ].join('\n')),
                ]
            });
        } catch (err) {
            output.err(err);
            return api.log.replyError(api, 'Błąd bazy danych', 'Operacja nie mogła zostać zakończona.');
        }
    },
};
