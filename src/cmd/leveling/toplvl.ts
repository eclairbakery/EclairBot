import { cfg } from '@/bot/cfg.js';
import { lvlRoles } from '@/bot/level.js';
import { db } from '@/bot/db.js';

import * as dsc from 'discord.js';
import { PredefinedColors } from '@/util/color.js';
import { Command, CommandFlags } from '@/bot/command.js';
import { output } from '@/bot/logging.js';
import User from '@/bot/apis/db/user.js';

function calculateLevel(xp: number, levelDivider: number): number {
    return Math.floor(
        (1 + Math.sqrt(1 + 8 * xp / levelDivider)) / 2
    );
}

export const toplvlCmd: Command = {
    name: 'toplvl',
    aliases: ['topka', 'toplevel'],
    description: {
        main: 'Czas popatrzeć na najlepszych użytkowników serwera...',
        short: 'Czas popatrzeć na najlepszych użytkowników serwera...',
    },
    flags: CommandFlags.None,

    permissions: {
        discordPerms: null,
        allowedRoles: null,
        allowedUsers: [],
    },
    expectedArgs: [],

    async execute(api) {
        const { msg } = api;

        try {
            const rows = await api.executor.leveling.getEveryoneXPWithLimit(50);

            if (rows.length == 0) {
                await msg.reply('Nie ma żadnego w bazie poziomu :sob:');
            }

            const fields: dsc.APIEmbedField[] = [];
            let i = 0;

            for (const row of rows) {
                if (++i > 12) break;

                try {
                    const member = await msg.guild?.members.fetch(row.user_id);
                    if (!member) { i--; continue; }

                    const userLvlRole = lvlRoles.filter(id => member.roles.cache.has(id)).at(-1);
                    fields.push({
                        name: `${i} » ${member.user.username}`,
                        value: `${userLvlRole ? `<@&${userLvlRole}>` : 'Nowicjusz...'}\n**Lvl**: ${calculateLevel(row.xp, cfg.features.leveling.levelDivider)}\n**XP**: ${row.xp}${i % 2 === 1 ? '‎' : ''}`,
                        inline: true
                    });
                } catch (e) {
                    output.warn(e);
                    i--;
                    continue;
                }
            }

            const serverXP = await (new User(api.msg.author.id)).leveling.getTotalServerXP();

            await msg.reply({
                embeds: [
                    new dsc.EmbedBuilder()
                        .setColor("#1ebfd5")
                        .setImage("https://cdn.discordapp.com/attachments/1404396223934369844/1404397238578577491/toplvl_image.png?ex=689b0a5a&is=6899b8da&hm=eac2a0db46bfad2dd34fa1ef8dbf9b918e46913229f7b1a9c470d952982787e8&"),
                    new dsc.EmbedBuilder()
                        .setFields(fields)
                        .setColor("#1ebfd5")
                        .setFooter({
                            text: `Poziom serwera: ${calculateLevel(serverXP, cfg.features.leveling.levelDivider)} LVL (XP: ${serverXP})`
                        })
                ]
            });
        } catch (err) {
            output.err(err);
            await msg.reply('❌ Wystąpił błąd podczas pobierania topu poziomów.');
        }
    },
};
