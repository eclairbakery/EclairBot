import { Command } from '../../bot/command';
import { cfg } from '../../bot/cfg'
import { db, sqlite } from '../../bot/db';

import * as log from '../../util/log';
import * as cfgManager from '../../bot/cfgManager';
import * as automod from '../../bot/automod';

import * as dsc from 'discord.js';
import { PredefinedColors } from '../../util/color';
import { dbGet } from '../../bot/shared';

export const lvlCmd: Command = {
    name: 'lvl',
    desc: 'Wyświetl swój level lub level wskazanego użytkownika.',
    category: 'poziomy',
    expectedArgs: [
        {
            name: 'user',
            desc: 'Opcjonalnie, użytkownik którego level chcesz sprawdzić.'
        }
    ],

    aliases: [],
    allowedRoles: null,
    allowedUsers: [],

    async execute(msg, args) {
        let who = msg.mentions.users.first() || msg.author;

        try {
            const row = await dbGet(`SELECT xp FROM leveling WHERE user_id = ?`, [who.id]) as any as { xp: number } | undefined;

            if (!row) {
                await msg.reply(`❌ Użytkownik **${who.tag}** nie znajduje się w bazie poziomów. Nic nie napisał, krótko mówiąc...`);
                return;
            }

            const embed = new dsc.EmbedBuilder()
                .setColor(PredefinedColors.Blue)
                .setTitle(`📊 Poziom użytkownika`)
                .setDescription(`**${who.tag}** ma poziom **${Math.floor(row.xp / cfg.general.leveling.level_divider)}** (XP: ${row.xp}).`)
                .setThumbnail(who.displayAvatarURL({ size: 128 }))

            await msg.reply({ embeds: [embed] });
        } catch (err) {
            console.error(err);
        }
    }
};