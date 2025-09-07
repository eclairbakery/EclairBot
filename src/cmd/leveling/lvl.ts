import { cfg } from '@/bot/cfg.js';
import { dbGet } from '@/bot/shared.js';

import * as dsc from 'discord.js';
import { PredefinedColors } from '@/util/color.js';
import { Command, CommandAPI } from '@/bot/command.js';

function calculateLevel(xp: number, levelDivider: number): number {
    return Math.floor(
        (1 + Math.sqrt(1 + 8 * xp / levelDivider)) / 2
    );
}

export const lvlCmd: Command = {
    name: 'lvl',
    description: {
        main: 'Wyświetl swój level lub level wskazanego użytkownika.',
        short: 'Wyświetl swój/kogoś level.',
    },
    permissions: {
        discordPerms: null,
        allowedRoles: null,
        allowedUsers: [],
    },
    expectedArgs: [
        {
            type: 'user-mention',
            optional: true,
            name: 'user',
            description: 'Opcjonalnie, użytkownik którego level chcesz sprawdzić.',
        }
    ],
    aliases: [],

    async execute(api: CommandAPI) {
        const userArg = api.getTypedArg('user', 'user-mention')?.value as dsc.GuildMember | null;
        const who = userArg?.user ?? api.msg.author.plainUser;

        try {
            const row = await dbGet(
                `SELECT xp FROM leveling WHERE user_id = ?`,
                [who.id]
            ) as { xp: number } | undefined;

            if (!row) {
                await api.msg.reply(
                    `❌ Użytkownik **${who.tag}** nie znajduje się w bazie poziomów. Nic nie napisał, krótko mówiąc...`
                );
                return;
            }

            const embed = new dsc.EmbedBuilder()
                .setColor(PredefinedColors.Blue)
                .setTitle(`📊 Poziom użytkownika`)
                .setDescription(
                    `**${who.tag}** ma poziom **${calculateLevel(row.xp, cfg.general.leveling.levelDivider)}** (XP: ${row.xp}).`
                )
                .setThumbnail(who.displayAvatarURL({ size: 128 }));

            await api.msg.reply({ embeds: [embed] });
        } catch (err) {
            console.error(err);
        }
    },
};