import { Command } from '@/bot/command.ts';
import { CommandFlags } from '@/bot/apis/commands/misc.ts';
import { db } from '@/bot/apis/db/bot-db.ts';
import { PredefinedColors } from '@/util/color.ts';
import { cfg } from '@/bot/cfg.ts';
import { output } from '@/bot/logging.ts';
import { sendLog } from '@/bot/apis/log/send-log.ts';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.ts';

const cmdCfg = cfg.commands.configuration.warn;

const warnClearCmd: Command = {
    name: 'warn-clear',
    aliases: ['clearwarn', 'warnusun'],
    description: {
        main: 'Usuwa warna o podanym ID. W dużym skrócie...',
        short: 'Usuwa warna',
    },
    flags: CommandFlags.Important,

    expectedArgs: [
        {
            name: 'id',
            type: { base: 'float' },
            description: 'No powiedz jaki warn...',
            optional: false,
        },
    ],
    permissions: {
        allowedRoles: cmdCfg.allowedRoles,
        allowedUsers: [],
    },

    async execute(api) {
        const warnIdArg = api.getTypedArg('id', 'float');

        if (!warnIdArg || isNaN(Number(warnIdArg.value))) {
            return api.log.replyError(api, 'Nieprawidłowe ID', 'Podaj numer ID warna do usunięcia.');
        }

        const warnId = Number(warnIdArg.value);

        try {
            const row = await db.selectOne('SELECT * FROM warns WHERE id = ?', [warnId]);
            if (!row) {
                return api.log.replyError(
                    api,
                    'Nie znaleziono',
                    `Jak masz warnlist, co nie? No to masz tam w nawiasie ID. Te ID potrzebujemy.`,
                );
            }

            const delResult = await db.runSql('DELETE FROM warns WHERE id = ?', [warnId]);
            if (!delResult.changes) {
                return api.log.replyError(api, 'Błąd podczas usuwania', 'Spróbuj ponownie później.');
            }

            sendLog({
                color: PredefinedColors.DarkAqua,
                title: 'Pozbyto się warna!',
                description: `Usunięto warna o ID \`${warnId}\`.`,
            });

            return api.reply({
                embeds: [
                    new ReplyEmbed()
                        .setTitle(':white_check_mark: Warn usunięty')
                        .setDescription(`Warn o ID \`${warnId}\` został pomyślnie usunięty.`)
                        .setColor(PredefinedColors.Green),
                ],
            });
        } catch (err) {
            output.warn(err);
            return api.log.replyError(api, 'Błąd bazy danych', 'Spróbuj ponownie później.');
        }
    },
};

export default warnClearCmd;
