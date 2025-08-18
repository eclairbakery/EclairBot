import { Command } from '../../bot/command.js';
import { db } from '../../bot/db.js';

import * as log from '../../util/log.js';
import * as dsc from 'discord.js';
import { PredefinedColors } from '../../util/color.js';

export const warnClearCmd: Command = {
    name: 'warn-clear',
    longDesc: 'Usuwa warna o podanym ID. W dużym skrócie...',
    shortDesc: 'Usuwa warna',
    expectedArgs: [ { name: 'id', desc: 'No powiedz jaki warn...' } ],

    aliases: ['clearwarn', 'warnusun'],
    allowedRoles: null,
    allowedUsers: [],

    async execute(msg, args) {
        if (!args[0] || isNaN(Number(args[0]))) {
            return log.replyError(msg, 'Nieprawidłowe ID', 'Podaj numer ID warna do usunięcia.');
        }

        const warnId = Number(args[0]);

        db.get('SELECT * FROM warns WHERE id = ?', [warnId], (err, row) => {
            if (err) {
                console.error(err);
                return log.replyError(msg, 'Błąd bazy danych', 'Spróbuj ponownie później.');
            }

            if (!row) {
                return log.replyError(msg, 'Nie znaleziono', `Jak masz warnlist, co nie? No to masz tam w nawiasie ID. Te ID potrzebujemy.`);
            }

            db.run('DELETE FROM warns WHERE id = ?', [warnId], (delErr) => {
                if (delErr) {
                    console.error(delErr);
                    return log.replyError(msg, 'Błąd podczas usuwania', 'Spróbuj ponownie później.');
                }

                return msg.reply({
                    embeds: [
                        new dsc.EmbedBuilder()
                            .setTitle(':white_check_mark: Warn usunięty')
                            .setDescription(`Warn o ID \`${warnId}\` został pomyślnie usunięty.`)
                            .setColor(PredefinedColors.Green)
                    ]
                });
            });
        });
    }
}
