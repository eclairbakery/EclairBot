import User from '@/bot/apis/db/user.js';

import * as dsc from 'discord.js';
import { Command, CommandAPI, CommandFlags } from '@/bot/command.js';
import { PredefinedColors } from '@/util/color.js';
import { formatMoney } from '@/util/math/format.js';
import { output } from '@/bot/logging.js';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.js';

export const balCmd: Command = {
    name: 'bal',
    aliases: ['balance'],
    description: {
        main: 'Wyświetl swój balans zadłużenia (raczej jesteś mało warty, w sensie konto, nie pozywaj za zniesławienie).',
        short: 'Wyświetl swój balans konta.',
    },
    flags: CommandFlags.Economy,

    permissions: {

        allowedRoles: null,
        allowedUsers: [],
    },
    expectedArgs: [
        {
            type: 'user-mention',
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
            const isIndebted = (balance.wallet + balance.bank) < 0;

            await api.reply({
                embeds: [
                    new ReplyEmbed()
                        .setTitle('📊 Twoje pieniądze')
                        .setDescription([
                            `Konto jest ${!isIndebted ? 'warte' : 'zadłużone o'} ${formatMoney(Math.abs(balance.wallet + balance.bank))}.`,
                            '',
                            `🏦 Pieniądze w banku: ${formatMoney(balance.bank)}`,
                            `👛 Pieniądze w portfelu: ${formatMoney(balance.wallet)}`,
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
