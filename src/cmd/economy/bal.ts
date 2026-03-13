import User from '@/bot/apis/db/user.js';

import * as dsc from 'discord.js';
import { Command, CommandAPI, CommandFlags } from '@/bot/command.js';
import { PredefinedColors } from '@/util/color.js';
import { output } from '@/bot/logging.js';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.js';

export const balCmd: Command = {
    name: 'bal',
    aliases: ['balance'],
    description: {
        main: 'Wyświetl swój balans zadłużenia.',
        short: 'Wyświetl swój balans konta.',
    },
    flags: CommandFlags.Economy,

    permissions: {
        allowedRoles: null,
        allowedUsers: [],
    },
    expectedArgs: [
        {
            type: { base: 'user-mention' },
            optional: true,
            name: 'user',
            description: 'Użytkownik, którego balans chcesz zobaczyć (domyślnie Ty).',
        }
    ],

    async execute(api: CommandAPI) {
        const who = api.getTypedArg('user', 'user-mention')?.value as dsc.GuildMember ?? api.invoker.member;

        const user = new User(who.id);

        try {
            const balance = await user.economy.getBalance();
            const total = balance.wallet.add(balance.bank);
            const isIndebted = total.isNegative();

            await api.reply({
                embeds: [
                    new ReplyEmbed()
                        .setTitle(`📊 Pieniądze użytkownika ${who.displayName}`)
                        .setDescription([
                            `Konto jest ${!isIndebted ? 'warte' : 'zadłużone o'} **${total.abs().format()}**.`,
                            '',
                            `🏦 Pieniądze w banku: **${balance.bank.format()}**`,
                            `👛 Pieniądze w portfelu: **${balance.wallet.format()}**`,
                        ].join('\n'))
                        .setColor(isIndebted ? PredefinedColors.Red : PredefinedColors.Gold)
                ]
            });
        } catch (err) {
            output.err(err);
            api.log.replyError(api, 'Błąd pobierania balansu', 'Coś poszło nie tak z bazą danych.');
        }
    }
};
