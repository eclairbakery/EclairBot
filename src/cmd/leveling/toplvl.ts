import { Command } from '../../bot/command';
import { cfg } from '../../bot/cfg'
import { db, sqlite } from '../../bot/db';

import * as log from '../../util/log';
import * as cfgManager from '../../bot/cfgManager';
import * as automod from '../../bot/automod';

import * as dsc from 'discord.js';
import { PredefinedColors } from '../../util/color';

export const toplvlCmd: Command = {
    name: 'toplvl',
    desc: 'Czas popatrzeć na najlepszych użytkowników serwera...',
    category: 'poziomy',
    expectedArgs: [],

    aliases: ['topka', 'toplevel'],
    allowedRoles: null,
    allowedUsers: [],

    execute(msg, args) {
        db.all('SELECT * FROM leveling', [], async (err, rows: any[]) => {
            if (err) {
                console.error(err);
                return log.replyError(msg, 'Błąd pobierania poziomów', 'Pytaj twórców biblioteki sqlite3...');
            }

            if (!rows.length) {
                return log.replyError(msg, 'Zero poziomów', 'Nie ma żadnego w bazie poziomu :sob:');
            }

            let fields: dsc.APIEmbedField[] = [];
            let i = 0;

            for (const row of rows) {
                i++;
                if (i == 25) return;
                fields.push({
                    name: `${i}. ${(await msg.client.users.fetch(row.user_id)).username}`,
                    value: `Poziom: ${Math.floor(row.xp / cfg.general.leveling.level_divider)}; XP: ${row.xp}`
                });
            }

            return msg.reply({
                embeds: [
                    new dsc.EmbedBuilder()
                        .setTitle(':loudspeaker: Topka poziomów')
                        .setFields(fields)
                        .setColor(PredefinedColors.Blurple)
                ]
            });
        });
    }
}