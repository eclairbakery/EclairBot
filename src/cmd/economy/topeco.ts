import * as dsc from 'discord.js';

import { Command} from "@/bot/command.ts";
import { CommandFlags } from '@/bot/apis/commands/misc.ts';

import { db } from '@/bot/apis/db/bot-db.ts';
import { output } from '@/bot/logging.ts';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.ts';

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
                    const balance = await user.economy.getBalance();

                    fields.push({
                        name: `${i} » ${member.user.username}`,
                        value: [
                            `${userEcoRole ? `<@&${userEcoRole}>` : 'Nowicjusz...'}`,
                            `**${balance.wallet.add(balance.bank).format()}$**`,
                        ].join('\n'),
                        inline: true,
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
