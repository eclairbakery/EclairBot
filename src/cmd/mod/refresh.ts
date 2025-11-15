import User from "@/bot/apis/db/user.js";
import { Command, CommandAPI, CommandFlags } from "@/bot/command.js";
import { addLvlRole, xpToLevel } from "@/bot/level.js";
import actionsManager, { OnForceReloadTemplates } from "@/events/actions/templatesEvents.js";
import * as dsc from 'discord.js';

export const refreshCmd: Command = {
    name: 'refresh',
    aliases: [],
    description: {
        main: 'Jeśli uważasz że template channels się nie przeładowały i pokazują błędne dane to... mylisz się! eclair bot jest idealny. A tak serio to tą komendą możesz wymusić reload',
        short: 'Wymusza przeładowanie wszystkich template channels',
    },
    flags: CommandFlags.Important,

    expectedArgs: [],
    permissions: {
        discordPerms: null,
        allowedRoles: null,
        allowedUsers: null,
    },

    async execute(api: CommandAPI) {
        if (!api.guild) {
            return api.log.replyWarn(api, 'Ta komenda wymaga serwera', 'Coś się wychrzaniło i EclairBOT nie może go znaleźć.')
        }
        const user = new User(api.msg.author.id);
        actionsManager.emit(OnForceReloadTemplates, {});
        for (const userLvlObj of await user.leveling.getEveryoneXPNoLimit()) {
            await addLvlRole(api.guild, xpToLevel(userLvlObj.xp), userLvlObj.user_id);
        }
        api.log.replySuccess(api, 'Udało się!', [
            'Pomyślnie przeładowano następujące rzeczy:',
            '- template channels (statystyki)',
            '- role poziomów'
        ].join('\n'));
    }
};
