import { NextGenerationCommand } from '../../bot/command.js';
import { db } from '../../bot/db.js';
import * as log from '../../util/log.js';
import * as dsc from 'discord.js';
import { PredefinedColors } from '../../util/color.js';
import { cfg } from '../../bot/cfg.js';

const cmdCfg = cfg.mod.commands.warn;

export const warnClearCmd: NextGenerationCommand = {
    name: 'warn-clear',
    description: {
        main: 'Usuwa warna o podanym ID. W dużym skrócie...',
        short: 'Usuwa warna'
    },
    args: [
        {
            name: 'id',
            type: 'number',
            description: 'No powiedz jaki warn...',
            optional: false
        }
    ],
    aliases: ['clearwarn', 'warnusun'],
    permissions: {
        discordPerms: null,
        allowedRoles: cmdCfg.allowedRoles,
        allowedUsers: []
    },

    async execute(api) {
        const warnIdArg = api.getTypedArg('id', 'number');

        if (!warnIdArg || isNaN(Number(warnIdArg.value))) {
            return log.replyError(api.msg, 'Nieprawidłowe ID', 'Podaj numer ID warna do usunięcia.');
        }

        const warnId = Number(warnIdArg.value);

        db.get('SELECT * FROM warns WHERE id = ?', [warnId], (err, row) => {
            if (err) {
                console.error(err);
                return log.replyError(api.msg, 'Błąd bazy danych', 'Spróbuj ponownie później.');
            }

            if (!row) {
                return log.replyError(
                    api.msg,
                    'Nie znaleziono',
                    `Jak masz warnlist, co nie? No to masz tam w nawiasie ID. Te ID potrzebujemy.`
                );
            }

            db.run('DELETE FROM warns WHERE id = ?', [warnId], async (delErr) => {
                if (delErr) {
                    console.error(delErr);
                    return log.replyError(api.msg, 'Błąd podczas usuwania', 'Spróbuj ponownie później.');
                }

                const channel = await api.msg.guild?.channels.fetch(cfg.logs.channel);
                if (!channel || !channel.isSendable()) return;

                channel.send({
                    embeds: [
                        new dsc.EmbedBuilder()
                            .setAuthor({ name: 'EclairBOT' })
                            .setColor(PredefinedColors.DarkAqua)
                            .setTitle('Pozbyto się warna!')
                            .setDescription(`Usunięto warna o ID \`${warnId}\`.`)
                    ]
                });

                return api.msg.reply({
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
};