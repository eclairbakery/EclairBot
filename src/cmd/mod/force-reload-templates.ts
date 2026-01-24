import { db } from '@/bot/apis/db/bot-db.js';
import * as log from '@/util/log.js';
import * as dsc from 'discord.js';
import { cfg } from '@/bot/cfg.js';
import { PredefinedColors } from '@/util/color.js';
import { Command, CommandAPI, CommandFlags } from '@/bot/command.js';
import actionsManager, { OnForceReloadTemplates } from '../../events/actions/templatesEvents.js';
import fmtEmoji from '@/util/fmtEmoji.js';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.js';

/** @deprecated */
export const forceReloadTemplatesCmd: Command = {
    name: 'force-reload-templates',
    aliases: [],
    description: {
        main: 'Jeśli uważasz że template channels się nie przeładowały i pokazują błędne dane to... mylisz się! eclair bot jest idealny. A tak serio to tą komendą możesz wymusić reload',
        short: 'Wymusza przeładowanie wszystkich template channels',
    },
    flags: CommandFlags.Important | CommandFlags.Deprecated,

    expectedArgs: [],
    permissions: {
        discordPerms: null,
        allowedRoles: null,
        allowedUsers: null,
    },

    async execute(api: CommandAPI) {
        actionsManager.emit(OnForceReloadTemplates, {});

        await api.reply({
            embeds: [
                new ReplyEmbed()
                    .setTitle('Przeladowano wszystkie template channels!')
                    .setDescription(`Teraz wszystko powinno być aktualne! a jeśli nie jest to już nie mój problem ${fmtEmoji(cfg.emoji.idkEmoji)}`)
                    .setColor(PredefinedColors.Aqua)
            ]
        });
    }
};
