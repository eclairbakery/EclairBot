import { cfg } from '@/bot/cfg.js';
import { dbGet } from '@/util/db-utils.js';

import * as dsc from 'discord.js';
import { PredefinedColors } from '@/util/color.js';
import { Command, CommandAPI, CommandFlags } from '@/bot/command.js';
import { xpToLevel, levelToXp, mkLvlProgressBar } from '@/bot/level.js';
import { output } from '@/bot/logging.js';

export const lvlCmd: Command = {
    name: 'lvl',
    aliases: [],
    description: {
        main: 'Wyświetl swój level lub level wskazanego użytkownika.',
        short: 'Wyświetl swój/kogoś level.',
    },
    flags: CommandFlags.None,

    expectedArgs: [
        {
            type: 'user-mention',
            optional: true,
            name: 'user',
            description: 'Opcjonalnie, użytkownik którego level chcesz sprawdzić.',
        }
    ],
    permissions: {
        discordPerms: null,
        allowedRoles: null,
        allowedUsers: null,
    },

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
                    `**${who.tag}** ma poziom **${xpToLevel(row.xp, cfg.general.leveling.levelDivider)}** (XP: ${row.xp}).`
                    + `\n${mkLvlProgressBar(
                        row.xp,
                        cfg.general.leveling.levelDivider
                    )}`,
                )
                .setThumbnail(who.displayAvatarURL({ size: 128 }));

            await api.msg.reply({ embeds: [embed] });
        } catch (err) {
            output.err(err);
        }
    },
};
