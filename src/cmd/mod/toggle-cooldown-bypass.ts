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

export const toggleCooldownBypassCmd: Command = {
    name: 'toggle-cooldown-bypass',
    description: {
        main: 'Dodaj użytkownika lub rolę do listy bez cooldownu dla danej komendy.',
        short: 'Dodaj bypass cooldownu.'
    },
    aliases: [],
    expectedArgs: [
        {
            name: 'cmd',
            description: 'komenda dla której nałozyć bypass',
            type: 'string',
            optional: false
        },
        {
            name: 'target',
            description: 'użytkownik lub roli do nałożenia bypassa',
            type: 'string',
            optional: false
        }
    ],
    flags: CommandFlags.None,
    permissions: {
        allowedRoles: [cfg.roles.mod, cfg.roles.headMod, cfg.roles.admin, cfg.roles.headAdmin, cfg.roles.eclair25],
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
            return api.log.replyError(api, 'Błąd', 'Podaj poprawne wspomnienie użytkownika lub roli!');
        }

        const cmdOverride = getCommandOverride(cat, cmdName);
        const currentMerged = (cfg.commands[cat] && cfg.commands[cat][cmdName]) ? cfg.commands[cat][cmdName] : cfg.defaultCommandConfig;
        
        let opText: string | undefined;
        if (userMatch) {
            const userId = userMatch[1];
            const currentList = currentMerged.cooldownBypassUsers ?? [];
            if (currentList.includes(userId)) {
                cmdOverride.cooldownBypassUsers = removeElement(currentList, userId);
                opText = 'usunięto';
            } else {
                cmdOverride.cooldownBypassUsers = [...currentList, userId];
                opText = 'dodano';
            }
        } else if (roleMatch) {
            const roleId = roleMatch[1];
            const currentList = currentMerged.cooldownBypassRoles ?? [];
            if (currentList.includes(roleId)) {
                cmdOverride.cooldownBypassRoles = removeElement(currentList, roleId);
                opText = 'usunięto';
            } else {
                cmdOverride.cooldownBypassRoles = [...currentList, roleId];
                opText = 'dodano';
            }
        }

        cfg.commands[cat] ??= {};
        cfg.commands[cat][cmdName] = deepMerge(currentMerged, cmdOverride);

        saveConfigurationChanges();
        api.log.replySuccess(api, 'Udało się!', `${opText} bypass cooldownu dla **${cmdName}**!`);
    }
};
