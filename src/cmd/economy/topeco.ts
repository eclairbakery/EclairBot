import { Command, CommandAPI, CommandFlags } from '@/bot/command.js';
import { cfg } from '@/bot/cfg.js';
import { db } from '@/bot/db.js';
import * as log from '@/util/log.js';
import * as dsc from 'discord.js';
import { output } from '@/bot/logging.js';

let ecoRoles = [
    "1235548306550161451"
];

export const topecoCmd: Command = {
    name: 'topeco',
    aliases: ['topmoney'],
    description: {
        main: 'Janusze biznesu z Allegro.',
        short: 'Janusze biznesu z Allegro.'
    },
    flags: CommandFlags.None,

    permissions: {
        discordPerms: null,
        allowedRoles: null,
        allowedUsers: []
    },
    expectedArgs: [],

    async execute(api) {
        const msg = api.msg;

        db.all('SELECT * FROM economy ORDER BY money DESC LIMIT 12', [], async (err, rows: any[]) => {
            if (err) {
                output.err(err);
                return api.log.replyError(msg, 'Błąd pobierania topki', 'Pytaj twórców biblioteki sqlite3...');
            }

            if (!rows.length) {
                return api.log.replyError(msg, 'Zero pieniędzy', 'Nie ma żadnego w bazie usera z hajsem :sob:');
            }

            let fields: dsc.APIEmbedField[] = [];
            let i = 0;

            for (const row of rows) {
                if (++i === 25) return;

                try {
                    const member = await msg.guild!.members.fetch(row.user_id);
                    const userEcoRole = ecoRoles.filter(id => member.roles.cache.has(id)).at(-1);

                    fields.push({
                        name: `${i} » ${member.user.username}`,
                        value: `${userEcoRole ? `<@&${userEcoRole}>` : 'Nowicjusz...'}\n${row.money}**$**`,
                        inline: true
                    });
                } catch {};
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
};
