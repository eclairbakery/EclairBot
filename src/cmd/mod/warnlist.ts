import { Command, CommandFlags } from '@/bot/command.js';
import { cfg } from '@/bot/cfg.js';
import { db } from '@/bot/db.js';

import * as log from '@/util/log.js';
import * as dsc from 'discord.js';
import { PredefinedColors } from '@/util/color.js';

export const warnlistCmd: Command = {
    name: 'warnlist',
    aliases: ['warn-list', 'warnlista'],
    description: {
        main: 'Lubisz warnować? No to przeczytaj log tych warnów...',
        short: 'Pokazuje liste warnów',
    },
    flags: CommandFlags.Important,

    expectedArgs: [],

    permissions: {
        allowedRoles: cfg.mod.commands.warn.allowedRoles,
        allowedUsers: [],
        discordPerms: [],
    },

    execute(api) {
        let client: dsc.Client;
        let guild: dsc.Guild;
        if (api.plainInteraction) {
            client = api.plainInteraction.client;
            guild = api.plainInteraction.guild;
        } else if (api.plainMessage) {
            client = api.plainMessage.client;
            guild = api.plainMessage.guild;
        } else {
            return log.replyError(api.msg, 'Błąd', 'Nie mogę znaleźć klienta bota...');
        }

        db.all('SELECT * FROM warns ORDER BY id DESC', [], async (err, rows: any[]) => {
            if (err) {
                console.error(err);
                return log.replyError(api.msg, 'Błąd pobierania warnów', 'Pytaj twórców biblioteki sqlite3...');
            }

            if (!rows.length) {
                return log.replyError(api.msg, 'Zero warnów', 'Nie ma żadnego w bazie warna...');
            }

            const fields: dsc.APIEmbedField[] = [];
            let i = 0;

            for (const row of rows) {
                i++;
                if (i > 25) break;

                const user = await client.users.fetch(row.user_id).catch(() => null);
                const moderator = row.moderator_id
                    ? await guild.members.fetch(row.moderator_id).catch(() => null)
                    : null;

                let value = `\`${row.reason_string}\` (punktów: ${row.points}, id: ${row.id})`;

                if (moderator) {
                    value += `\n**Moderator**: <@${moderator.id}>`;
                }

                if (row.expires_at) {
                    value += `\n**Wygasa:** <t:${row.expires_at}:R>`;
                }

                fields.push({
                    name: `${i}. Upomnienie dla ${user ? user.username : 'Nieznany użytkownik'}`,
                    value
                });
            }

            return api.msg.reply({
                embeds: [
                    new dsc.EmbedBuilder()
                        .setTitle(':loudspeaker: Ostatnie warny')
                        .setFields(fields)
                        .setColor(PredefinedColors.Blurple)
                ]
            });
        });
    }
};
