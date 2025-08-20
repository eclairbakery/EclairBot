import { Command } from '../../bot/command.js';
import { cfg } from '../../bot/cfg.js'
import { db, sqlite } from '../../bot/db.js';

import * as log from '../../util/log.js';
import * as cfgManager from '../../bot/cfgManager.js';

import * as dsc from 'discord.js';
import { PredefinedColors } from '../../util/color.js';

let ecoRoles = [
    "1235548306550161451" // na razie
];

export const topecoCmd: Command = {
    name: 'topeco',
    longDesc: 'Janusze biznesu z Allegro.',
    shortDesc: 'Janusze biznesu z Allegro.',
    expectedArgs: [],

    aliases: ['topmoney'],
    allowedRoles: null,
    allowedUsers: [],

    execute(msg, args) {
        db.all('SELECT * FROM economy ORDER BY money DESC LIMIT 12', [], async (err, rows: any[]) => {
            if (err) {
                console.error(err);
                return log.replyError(msg, 'Błąd pobierania topki', 'Pytaj twórców biblioteki sqlite3...');
            }

            if (!rows.length) {
                return log.replyError(msg, 'Zero pieniędzy', 'Nie ma żadnego w bazie usera z hajsem :sob:');
            }

            let fields: dsc.APIEmbedField[] = [];
            let i = 0;

            for (const row of rows) {
                if (++i === 25) return;

                const member = await msg.guild.members.fetch(row.user_id);
                const userEcoRole = ecoRoles.filter(id => member.roles.cache.has(id)).at(-1);

                fields.push({
                    name: `${i} » ${member.user.username}`,
                    value: `${userEcoRole ? `<@&${userEcoRole}>` : 'Nowicjusz...'}\n${row.money}**$**`,
                    inline: true
                });
            }

            return msg.reply({
                embeds: [
                    new dsc.EmbedBuilder()
                        .setFields(fields)
                        .setColor("#1ebfd5")
                ]
            });
        });
    }
}
