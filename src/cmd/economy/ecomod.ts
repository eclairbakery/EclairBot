import { cfg } from "@/bot/cfg.js";
import { db } from '@/bot/apis/db/bot-db.js';
import { Command} from "@/bot/command.js";
import { CommandFlags } from '@/bot/apis/commands/misc.js';
import { PredefinedColors } from '@/util/color.js';
import { output } from '@/bot/logging.js';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.js';

import User from "@/bot/apis/db/user.js";
import Money from "@/util/money.js";

export const ecomodCmd: Command = {
    name: 'ecomod',
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
            type: { base: 'user-mention', includeRefMessageAuthor: true },
            optional: false
        },
        {
            name: 'action',
            description: 'Tu powiedz co chcesz zrobić (add/set/remove)',
            type: { base: 'enum', options: ['add', 'set', 'remove'] as const },
            optional: false
        },
        {
            name: 'amount',
            description: 'Tu powiedz na jakiej ilości hajsu chcesz to zrobić',
            type: { base: 'money' },
            optional: false
        },
        {
            name: 'location',
            description: 'A tu czy w banku czy nie. Domyślnie w portfelu. (wallet/bank)',
            type: { base: 'enum', options: ['bank', 'wallet'] as const },
            optional: true
        },
    ],
    permissions: {
        allowedRoles: [cfg.hierarchy.administration.eclair25, cfg.hierarchy.administration.headAdmin],
        allowedUsers: []
    },

    async execute(api) {
        const action = api.getEnumArg('action', ['add', 'set', 'remove'])?.value!;
        const amount = api.getTypedArg('amount', 'money')?.value!;
        const location = (api.getEnumArg('location', ['wallet', 'bank'])?.value) || 'wallet';
        const targetMember = api.getTypedArg('who', 'user-mention')?.value!;

        if (amount.isNegative()) return api.log.replyError(api, 'Nieprawidłowa kwota', 'Nie może być ona ujemna.');

        const targetId = targetMember.id;
        const targetUser = new User(targetId);

        try {
            let before: Money, after: Money;

            await db.transaction(async () => {
                const bal = await targetUser.economy.getBalance();
                const current = bal[location];
                before = current.clone();

                if (action == 'add') {
                    after = current.add(amount);
                } else if (action == 'set') {
                    after = amount.clone();
                } else if (action == 'remove') {
                    after = current.sub(amount);
                    if (after.isNegative()) after = Money.zero();
                }

                bal[location] = after;
                await targetUser.economy.setBalance(bal);
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
                            `Przed: **${before!.format()}**`,
                            `Po: **${after!.format()}**`,
                        ].join('\n')),
                ]
            });
        } catch (err) {
            output.err(err);
            return api.log.replyError(api, 'Błąd bazy danych', 'Operacja nie mogła zostać zakończona.');
        }
    },
};
