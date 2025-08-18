import { Command } from '../../bot/command.js';
import { cfg } from '../../bot/cfg.js'
import { db, sqlite } from '../../bot/db.js';
import { lvlRoles } from '../../bot/level.js';

import * as log from '../../util/log.js';
import * as cfgManager from '../../bot/cfgManager.js';
import * as automod from '../../bot/automod.js';

import * as dsc from 'discord.js';
import { PredefinedColors } from '../../util/color.js';

function calculateLevel(xp: number, level_divider: number): number {
    return Math.floor(
        (1 + Math.sqrt(1 + 8 * xp / cfg.general.leveling.levelDivider)) / 2
    );
}

export const toplvlCmd: Command = {
    name: 'toplvl',
    longDesc: 'Czas popatrzeć na najlepszych użytkowników serwera...',
    category: 'poziomy',
    expectedArgs: [],

    aliases: ['topka', 'toplevel'],
    allowedRoles: null,
    allowedUsers: [],

    execute(msg, args) {
        db.all('SELECT * FROM leveling ORDER BY xp DESC LIMIT 12', [], async (err, rows: any[]) => {
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
                if (++i === 25) return;

                const member = await msg.guild.members.fetch(row.user_id);
                const userLvlRole = lvlRoles.filter(id => member.roles.cache.has(id)).at(-1);

                fields.push({
                    name: `${i} » ${member.user.username}`,
                    value: `${userLvlRole ? `<@&${userLvlRole}>` : 'Nowicjusz...'}\n**Lvl**: ${calculateLevel(row.xp, cfg.general.leveling.levelDivider)}\n**XP**: ${row.xp}${i % 2 == 1 ? '‎' : ''}`,
                    inline: true
                });
            }

            return msg.reply({
                embeds: [
                    new dsc.EmbedBuilder()
                        .setColor("#1ebfd5")
                        .setImage("https://cdn.discordapp.com/attachments/1404396223934369844/1404397238578577491/toplvl_image.png?ex=689b0a5a&is=6899b8da&hm=eac2a0db46bfad2dd34fa1ef8dbf9b918e46913229f7b1a9c470d952982787e8&"),
                    new dsc.EmbedBuilder()
                        .setFields(fields)
                        .setColor("#1ebfd5")
                ]
            });
        });
    }
}
