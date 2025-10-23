import { cfg } from '@/bot/cfg.js';
import { db } from '@/bot/db.js';
import * as dsc from 'discord.js';
import * as log from '@/util/log.js';
import { Command, CommandAPI, CommandFlags } from '@/bot/command.js';
import { output } from '@/bot/logging.js';

export const balCmd: Command = {
    name: 'bal',
    aliases: ['balance'],
    description: {
        main: 'Wyświetl swój balans zadłużenia (raczej jesteś mało warty, w sensie konto, nie pozywaj za zniesławienie).',
        short: 'Wyświetl swój balans konta.',
    },
    flags: CommandFlags.Economy,

    permissions: {
        discordPerms: null,
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
        const who = api.getTypedArg('user', 'user-mention')?.value as dsc.GuildMember ?? api.msg.member!.plainMember;

        try {
            const row: { money: number, bank_money: number; } = (await new Promise((resolve, reject) => {
                db.get('SELECT * FROM economy WHERE user_id = ?', [who.id], (err, row: any) => {
                    if (err) return reject(err);
                    resolve(row);
                });
            })) ?? { money: 0, bank_money: 0 };

            row.money = row.money ?? 0;
            row.bank_money = row.bank_money ?? 0;

            await api.msg.reply({
                embeds: [
                    new dsc.EmbedBuilder()
                        .setTitle('📊 Twoje pieniądze')
                        .setDescription(`Konto jest ${row.money >= 0 ? 'warte' : 'zadłużone o'} ${Math.abs(row.money + row.bank_money)}$.\n\n💳 Pieniądze w banku: ${row.bank_money}\n💷 Pieniądze w portfelu: ${row.money}`)
                        .setColor("#1ebfd5")
                ]
            });
        } catch (err) {
            output.err(err);
            log.replyError(api.msg, 'Błąd pobierania balansu', 'Coś poszło nie tak z bazą danych.');
        }
    }
};
