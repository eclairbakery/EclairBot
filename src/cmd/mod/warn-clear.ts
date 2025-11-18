import { Command, CommandFlags } from '@/bot/command.js';
import { db } from '@/bot/apis/db/bot-db.js';
import * as log from '@/util/log.js';
import * as dsc from 'discord.js';
import { PredefinedColors } from '@/util/color.js';
import { cfg } from '@/bot/cfg.js';
import { output } from '@/bot/logging.js';
import { sendLog } from '@/bot/apis/log/send-log.js';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.js';

const cmdCfg = cfg.commands.mod.warn;

export const warnClearCmd: Command = {
    name: 'warn-clear',
    aliases: ['clearwarn', 'warnusun'],
    description: {
        main: 'Usuwa warna o podanym ID. W dużym skrócie...',
        short: 'Usuwa warna'
    },
    flags: CommandFlags.Important,

    expectedArgs: [
        {
            name: 'id',
            type: 'number',
            description: 'No powiedz jaki warn...',
            optional: false
        }
    ],
    permissions: {
        discordPerms: null,
        allowedRoles: cmdCfg.allowedRoles,
        allowedUsers: []
    },

    async execute(api) {
        const warnIdArg = api.getTypedArg('id', 'number');

        if (!warnIdArg || isNaN(Number(warnIdArg.value))) {
            return api.log.replyError(api.msg, 'Nieprawidłowe ID', 'Podaj numer ID warna do usunięcia.');
        }

        const warnId = Number(warnIdArg.value);

        try {
            const row = await db.selectOne('SELECT * FROM warns WHERE id = ?', [warnId]);
            if (!row) {
                return api.log.replyError(
                    api.msg,
                    'Nie znaleziono',
                    `Jak masz warnlist, co nie? No to masz tam w nawiasie ID. Te ID potrzebujemy.`
                );
            }

            const delResult = await db.runSql('DELETE FROM warns WHERE id = ?', [warnId]);
            if (!delResult.changes) {
                return api.log.replyError(api.msg, 'Błąd podczas usuwania', 'Spróbuj ponownie później.');
            }

            sendLog({
                color: PredefinedColors.DarkAqua,
                title: 'Pozbyto się warna!',
                description: `Usunięto warna o ID \`${warnId}\`.`
            });

            return api.reply({
                embeds: [
                    new ReplyEmbed()
                        .setTitle(':white_check_mark: Warn usunięty')
                        .setDescription(`Warn o ID \`${warnId}\` został pomyślnie usunięty.`)
                        .setColor(PredefinedColors.Green)
                ]
            });
        } catch (err) {
            output.warn(err);
            return api.log.replyError(api.msg, 'Błąd bazy danych', 'Spróbuj ponownie później.');
        }
    }
};
