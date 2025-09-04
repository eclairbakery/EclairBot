import { cfg } from '../../bot/cfg.js';
import { db } from '../../bot/db.js';
import * as dsc from 'discord.js';
import * as log from '../../util/log.js';
import { NextGenerationCommand, NextGenerationCommandAPI } from '../../bot/command.js';

export const balCmd: NextGenerationCommand = {
    name: 'bal',
    description: {
        main: 'Wyświetl swój balans zadłużenia (raczej jesteś mało warty, w sensie konto, nie pozywaj za zniesławienie).',
        short: 'Wyświetl swój balans konta.',
    },
    permissions: {
        discordPerms: null,
        allowedRoles: null,
        allowedUsers: [],
    },
    args: [
        {
            type: 'user-mention',
            optional: true,
            name: 'user',
            description: 'Użytkownik, którego balans chcesz zobaczyć (domyślnie Ty).',
        }
    ],
    aliases: ['balance'],

    async execute(api: NextGenerationCommandAPI) {
        const who = api.getTypedArg('user', 'user-mention')?.value as dsc.GuildMember ?? api.msg.member.plainMember;

        try {
            const row: { money: number } | undefined = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM economy WHERE user_id = ?', [who.id], (err, row: any) => {
                    if (err) return reject(err);
                    resolve(row);
                });
            });

            if (!row) {
                return log.replyError(api.msg, 'Zero pieniędzy', 'Nie ma żadnego w bazie takiego usera z hajsem :sob:');
            }

            await api.msg.reply({
                embeds: [
                    new dsc.EmbedBuilder()
                        .setTitle('📊 Twoje pieniądze')
                        .setDescription(`Konto jest ${row.money >= 0 ? 'warte' : 'zadłużone o'} ${Math.abs(row.money)}$.`)
                        .setColor("#1ebfd5")
                ]
            });
        } catch (err) {
            console.error(err);
            log.replyError(api.msg, 'Błąd pobierania balansu', 'Coś poszło nie tak z bazą danych.');
        }
    }
};