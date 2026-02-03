import { Command, CommandAPI, CommandFlags } from '@/bot/command.js';
import { cfg } from '@/bot/cfg.js';
import { db } from '@/bot/apis/db/bot-db.js';
import * as log from '@/util/log.js';
import * as dsc from 'discord.js';
import { output } from '@/bot/logging.js';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.js';

let ecoRoles = [
    "1235548306550161451"
];

export const topecoCmd: Command = {
    name: 'topeco',
    aliases: ['topmoney'],
    description: {
        main: 'Janusze biznesu z Allegro. Kup procesor za 10 THz (10 tyś. GHz) za JEDYNE 10 ZŁOTYCH!',
        short: 'Janusze biznesu z Allegro.'
    },
    flags: CommandFlags.None,

    permissions: {

        allowedRoles: null,
        allowedUsers: []
    },
    expectedArgs: [],

    async execute(api) {
        try {
            const topUsers = await db.economy.getTopTotal(12);

            if (!topUsers.length) {
                return api.log.replyError(api, 'Zero pieniędzy', 'Nie ma żadnego w bazie usera z hajsem :sob:');
            }

            let fields: dsc.APIEmbedField[] = [];
            let i = 0;

            for (const user of topUsers) {
                if (++i === 25) return;

                try {
                    const member = await api.guild!.members.fetch(user.id);
                    const userEcoRole = ecoRoles.filter(id => member.roles.cache.has(id)).at(-1);

                    fields.push({
                        name: `${i} » ${member.user.username}`,
                        value: [
                            `${userEcoRole ? `<@&${userEcoRole}>` : 'Nowicjusz...'}`,
                            `${(await user.economy.getBalance()).wallet + (await user.economy.getBalance()).bank}**$**`,
                        ].join('\n'),
                        inline: true
                    });
                } catch {};
            }

            return api.reply({
                embeds: [
                    new ReplyEmbed()
                        .setFields(fields)
                        .setColor("#1ebfd5")
                ]
            });
        } catch (err) {
            output.err(err);
            return api.log.replyError(api, 'Błąd pobierania topki', 'Pytaj twórców biblioteki sqlite3...');
        }
    }
};
