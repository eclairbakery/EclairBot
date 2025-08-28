import { Command } from '../../bot/command.js';
import { db } from '../../bot/db.js';

import * as log from '../../util/log.js';
import * as dsc from 'discord.js';
import { PredefinedColors } from '../../util/color.js';
import { cfg } from '../../bot/cfg.js';

const cmdCfg = cfg.mod.commands.warn;

export const warnClearCmd: Command = {
    name: 'warn-clear',
    longDesc: 'Usuwa warna o podanym ID. W dużym skrócie...',
    shortDesc: 'Usuwa warna',
    expectedArgs: [ { name: 'id', desc: 'No powiedz jaki warn...' } ],

    aliases: ['clearwarn', 'warnusun'],
    allowedRoles: cmdCfg.allowedRoles,
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

            db.run('DELETE FROM warns WHERE id = ?', [warnId], async (delErr) => {
                if (delErr) {
                    console.error(delErr);
                    return log.replyError(msg, 'Błąd podczas usuwania', 'Spróbuj ponownie później.');
                }

                const channel = await msg.client.channels.fetch(cfg.logs.channel);
                if (!channel.isSendable()) return;
                channel.send({
                    embeds: [
                        new dsc.EmbedBuilder()
                            .setAuthor({
                                name: 'EclairBOT'
                            })
                            .setColor(PredefinedColors.DarkAqua)
                            .setTitle('Pozbyto się warna!')
                            .setDescription(`Usunięto warna o ID \`${warnId}\`.`)
                    ]
                });

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
