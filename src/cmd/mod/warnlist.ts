import { Command } from '../../bot/command.js';
import { cfg } from '../../bot/cfg'
import { db, sqlite } from '../../bot/db.js';

import * as log from '../../util/log.js';
import * as cfgManager from '../../bot/cfgManager.js';
import * as automod from '../../bot/automod.js';

import * as dsc from 'discord.js';
import { PredefinedColors } from '../../util/color.js';

export const warnlistCmd: Command = {
    name: 'warnlist',
    desc: 'Lubisz warnować? No to przeczytaj log tych warnów...',
    category: 'moderacyjne rzeczy',
    expectedArgs: [],

    aliases: ['warnlista'],
    allowedRoles: null,
    allowedUsers: [],

    execute(msg, args) {
        db.all('SELECT * FROM warns', [], async (err, rows: any[]) => {
            if (err) {
                console.error(err);
                return log.replyError(msg, 'Błąd pobierania warnów', 'Pytaj twórców biblioteki sqlite3...');
            }

            if (!rows.length) {
                return log.replyError(msg, 'Zero warnów', 'Nie ma żadnego w bazie warna...');
            }

            let fields: dsc.APIEmbedField[] = [];
            let i = 0;

            for (const row of rows) {
                i++;
                if (i == 25) return;
                fields.push({
                    name: `${i}. Upomnienie dla ${(await msg.client.users.fetch(row.user_id)).username}`,
                    value: `\`${row.reason_string}\` (punktów: ${row.points})`
                });
            }

            return msg.reply({
                embeds: [
                    new dsc.EmbedBuilder()
                        .setTitle(':loudspeaker: Ostatnie warny')
                        .setFields(fields)
                        .setColor(PredefinedColors.Blurple)
                ]
            });
        });
    }
}