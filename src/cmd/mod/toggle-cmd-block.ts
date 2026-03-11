import { cfg, getCommandOverride, saveConfigurationChanges } from "@/bot/cfg.js";
import { Command, CommandFlags } from "@/bot/command.js";
import { findCmdConfCategory } from "@/util/cmd/findCmdConfigObj.js";
import { deepMerge } from "@/util/objects/objects.js";

import * as dsc from 'discord.js';

function removeElement(arr: dsc.Snowflake[], target: dsc.Snowflake): dsc.Snowflake[] {
    let result = [];
    for (const elem of arr) {
        if (elem != target) {
            result.push(elem);
        }
    }
    return result;
}

export const toggleCmdBlockCmd: Command = {
    name: 'toggle-cmd-block',
    description: {
        main: 'Zablokuj komuś możliwość używania danej komendy.',
        short: 'Zablokuj komendę dla kogoś'
    },
    aliases: ['block-cmd-for-user'],
    expectedArgs: [
        {
            name: 'cmd',
            description: 'komenda którą chcesz zablokować',
            type: { base: 'string' },
            optional: false
        },
        {
            name: 'target',
            description: 'użytkownik lub rola do zablokowania/odblokowania',
            type: { base: 'string' },
            optional: false
        }
    ],
    flags: CommandFlags.None,
    permissions: {
        allowedRoles: [cfg.roles.headMod, cfg.roles.admin, cfg.roles.headAdmin, cfg.roles.eclair25],
        allowedUsers: [],
    },

    async execute(api) {
        const cmdName = api.getTypedArg('cmd', 'string')?.value!;
        const target = api.getTypedArg('target', 'string')?.value!;
        const cat = findCmdConfCategory(cmdName);

        if (!cat) return api.log.replyError(api, 'Błąd', `Nie znaleziono komendy **${cmdName}**!`);

        const userMatch = /^<@!?(\d+)>$/.exec(target);
        const roleMatch = /^<@&(\d+)>$/.exec(target);

        if (!userMatch && !roleMatch) {
            return api.log.replyError(api, 'Błąd', 'Podaj poprawną wzmianke użytkownika lub roli!');
        }

        const cmdOverride = getCommandOverride(cat, cmdName);
        const currentMerged = (cfg.commands[cat] && cfg.commands[cat][cmdName]) ? cfg.commands[cat][cmdName] : cfg.defaultCommandConfig;
        
        let opText: string | undefined;
        if (userMatch) {
            const userId = userMatch[1];
            const currentList = currentMerged.disallowedUsers ?? [];
            if (currentList.includes(userId)) {
                cmdOverride.disallowedUsers = removeElement(currentList, userId);
                opText = 'Odblokowano';
            } else {
                cmdOverride.disallowedUsers = [...currentList, userId];
                opText = 'Zablokowano';
            }
        } else if (roleMatch) {
            const roleId = roleMatch[1];
            const currentList = currentMerged.disallowedRoles ?? [];
            if (currentList.includes(roleId)) {
                cmdOverride.disallowedRoles = removeElement(currentList, roleId);
                opText = 'Odblokowano';
            } else {
                cmdOverride.disallowedRoles = [...currentList, roleId];
                opText = 'Zablokowano';
            }
        }

        cfg.commands[cat] ??= {};
        cfg.commands[cat][cmdName] = deepMerge(currentMerged, cmdOverride);

        saveConfigurationChanges();
        api.log.replySuccess(api, 'Udało się!', `**${opText}** dostęp do komendy **${cmdName}** dla podanego celu!`);
    }
};
