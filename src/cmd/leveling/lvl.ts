import * as dsc from 'discord.js';

import { cfg } from '@/bot/cfg.ts';

import { PredefinedColors } from '@/util/color.ts';
import { Command } from '@/bot/command.ts';
import { CommandFlags } from '@/bot/apis/commands/misc.ts';
import { CommandAPI } from '@/bot/apis/commands/api.ts';
import { mkLvlProgressBar, xpToLevel } from '@/bot/level.ts';
import { output } from '@/bot/logging.ts';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.ts';

import User from '@/bot/apis/db/user.ts';

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
            type: { base: 'user-mention' },
            optional: true,
            name: 'user',
            description: 'Opcjonalnie, użytkownik którego level chcesz sprawdzić.',
        },
    ],
    permissions: {
        allowedRoles: null,
        allowedUsers: null,
    },

    async execute(api: CommandAPI) {
        const userArg = api.getTypedArg('user', 'user-mention')?.value as dsc.GuildMember | null;
        const who = userArg?.user ?? api.invoker.user;

        try {
            const user = new User(who.id);
            const row = await user.leveling.getXP();

            const embed = new ReplyEmbed()
                .setColor(PredefinedColors.Blue)
                .setTitle(`📊 Poziom użytkownika`)
                .setDescription(
                    `**${who.tag}** ma poziom **${xpToLevel(row, cfg.features.leveling.levelDivider)}** (XP: ${row}).` +
                        `\n${
                            mkLvlProgressBar(
                                row,
                                cfg.features.leveling.levelDivider,
                            )
                        }`,
                )
                .setThumbnail(who.displayAvatarURL({ size: 128 }));

            await api.reply({ embeds: [embed] });
        } catch (err) {
            output.err(err);
        }
    },
};
