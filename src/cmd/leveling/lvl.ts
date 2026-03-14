import * as dsc from 'discord.js';

import { cfg } from '@/bot/cfg.js';

import { PredefinedColors } from '@/util/color.js';
import { Command} from "@/bot/command.js";
import { CommandFlags } from '@/bot/apis/commands/misc.js';
import { CommandPermissions } from '@/bot/apis/commands/permissions.js';
import { CommandAPI } from '@/bot/apis/commands/api.js';
import { xpToLevel, mkLvlProgressBar } from '@/bot/level.js';
import { output } from '@/bot/logging.js';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.js';

import User from '@/bot/apis/db/user.js';

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
        }
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
                    `**${who.tag}** ma poziom **${xpToLevel(row, cfg.features.leveling.levelDivider)}** (XP: ${row}).`
                    + `\n${mkLvlProgressBar(
                        row,
                        cfg.features.leveling.levelDivider
                    )}`,
                )
                .setThumbnail(who.displayAvatarURL({ size: 128 }));

            await api.reply({ embeds: [embed] });
        } catch (err) {
            output.err(err);
        }
    },
};
