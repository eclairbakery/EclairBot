import { cfg } from '@/bot/cfg.js';
import { lvlRoles } from '@/bot/level.js';
import { db } from '@/bot/db.js';

import * as dsc from 'discord.js';
import { PredefinedColors } from '@/util/color.js';
import { Command, CommandAPI } from '@/bot/command.js';

function calculateLevel(xp: number, levelDivider: number): number {
    return Math.floor(
        (1 + Math.sqrt(1 + 8 * xp / levelDivider)) / 2
    );
}

export const toplvlCmd: Command = {
    name: 'toplvl',
    description: {
        main: 'Czas popatrzeć na najlepszych użytkowników serwera...',
        short: 'Czas popatrzeć na najlepszych użytkowników serwera...',
    },
    permissions: {
        discordPerms: null,
        allowedRoles: null,
        allowedUsers: [],
    },
    expectedArgs: [],
    aliases: ['topka', 'toplevel'],

    async execute(api: CommandAPI) {
        const { msg } = api;

        try {
            const rows: { user_id: string, xp: number }[] = await new Promise((resolve, reject) => {
                db.all('SELECT * FROM leveling ORDER BY xp DESC LIMIT 50', [], (err, rows: any[]) => {
                    if (err) return reject(err);
                    resolve(rows);
                });
            });

            if (!rows.length) {
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
                        value: `${userLvlRole ? `<@&${userLvlRole}>` : 'Nowicjusz...'}\n**Lvl**: ${calculateLevel(row.xp, cfg.general.leveling.levelDivider)}\n**XP**: ${row.xp}${i % 2 === 1 ? '‎' : ''}`,
                        inline: true
                    });
                } catch (e) {
                    console.log(e);
                    i--;
                    continue;
                }
            }

            await msg.reply({
                embeds: [
                    new dsc.EmbedBuilder()
                        .setColor("#1ebfd5")
                        .setImage("https://cdn.discordapp.com/attachments/1404396223934369844/1404397238578577491/toplvl_image.png?ex=689b0a5a&is=6899b8da&hm=eac2a0db46bfad2dd34fa1ef8dbf9b918e46913229f7b1a9c470d952982787e8&"),
                    new dsc.EmbedBuilder()
                        .setFields(fields)
                        .setColor("#1ebfd5")
                ]
            });
        } catch (err) {
            console.error(err);
            await msg.reply('❌ Wystąpił błąd podczas pobierania topu poziomów.');
        }
    },
};