import * as dsc from 'discord.js';

import { Command } from '@/bot/command.ts';
import { CommandFlags } from '@/bot/apis/commands/misc.ts';
import { output } from '@/bot/logging.ts';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.ts';
import { db } from '@/bot/apis/db/bot-db.ts';

const topprestigeCmd: Command = {
    name: 'topprestige',
    aliases: ['top-prestige', 'top-prestiżu'],
    description: {
        main: 'Czas popatrzeć na najbardziej renomowanych, dobrych i fajnych użytkowników serwera...',
        short: 'Topka prestiżu.',
    },
    flags: CommandFlags.None,

    permissions: {
        allowedRoles: null,
        allowedUsers: [],
    },
    expectedArgs: [],

    async execute(api) {
        const rows = await db.prestige.getTop(50);

        if (rows.length == 0) {
            await api.reply('Nie ma żadnego w bazie prestiżu :sob:');
        }

        const fields: dsc.APIEmbedField[] = [];
        let i_abs = 0;
        let i_real = 0;

        for (const row of rows) {
            i_abs++;
            if (++i_real > 12) break;

            try {
                const member = await api.guild?.members.fetch(row.id);
                if (!member) {
                    i_real--;
                    continue;
                }

                fields.push({
                    name: `${i_abs} » ${member.user.username}`,
                    value: `Punktów prestiżu: ${await row.prestige.getPoints()}`,
                    inline: true,
                });
            } catch (e) {
                output.warn(e);
                i_real--;
                continue;
            }
        }

        await api.reply({
            embeds: [
                new ReplyEmbed()
                    .setColor('#1ebfd5')
                    .setDescription('-# nie ma jeszcze obrazka na topkę prestiżu'),
                new ReplyEmbed()
                    .setFields(fields)
                    .setColor('#1ebfd5')
            ],
        });
    },
};

export default topprestigeCmd;
