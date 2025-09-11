import { cfg } from '@/bot/cfg.js';
import { dbGet } from '@/util/db-utils.js';

import * as dsc from 'discord.js';
import { PredefinedColors } from '@/util/color.js';
import { Command, CommandAPI } from '@/bot/command.js';

function xpToLevel(xp: number, levelDivider: number): number {
    return Math.floor(
        (1 + Math.sqrt(1 + 8 * xp / levelDivider)) / 2
    );
}

function levelToXp(level: number, levelDivider: number): number {
    return Math.floor((level * (level - 1) / 2) * levelDivider);
}

function mkProgressBar(xp: number, xpForNextLevel: number, length: number = 10): string {
    const progress = Math.min(xp / xpForNextLevel, 1);
    const filledLength = Math.floor(length * progress);
    const emptyLength = length - filledLength;

    return `${'█'.repeat(filledLength)}${'░'.repeat(emptyLength)} ${xp}/${xpForNextLevel}xp`;
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
                    `**${who.tag}** ma poziom **${xpToLevel(row.xp, cfg.general.leveling.levelDivider)}** (XP: ${row.xp}).`
                    + `\n${mkProgressBar(
                        row.xp,
                        levelToXp(
                            xpToLevel(row.xp, cfg.general.leveling.levelDivider) + 1,
                            cfg.general.leveling.levelDivider,
                        )
                    )}`,
                )
                .setThumbnail(who.displayAvatarURL({ size: 128 }));

            await api.msg.reply({ embeds: [embed] });
        } catch (err) {
            console.error(err);
        }
    },
};
