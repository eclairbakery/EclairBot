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
            type: { base: 'command-ref' },
            optional: false
        },
        {
            name: 'target',
            description: 'użytkownik lub roli do nałożenia bypassa',
            type: {
                base: 'union',
                variants: [
                    { base: 'user-mention', includeRefMessageAuthor: true },
                    { base: 'role-mention' }
                ]
            },
            optional: false
        }
    ],
    flags: CommandFlags.None,
    permissions: {
        allowedRoles: [cfg.legacy.roles.mod, cfg.legacy.roles.headMod, cfg.legacy.roles.admin, cfg.legacy.roles.headAdmin, cfg.legacy.roles.eclair25],
        allowedUsers: [],
    },

    async execute(api) {
        const cmd = api.getTypedArg('cmd', 'command-ref')?.value;
        const target = api.getTypedArg('target', ['user-mention', 'role-mention']);

        const cmdName = cmd.name;
        const cat = findCmdConfCategory(cmdName);

        if (!cat) return api.log.replyError(api, 'Błąd', `Nie znaleziono komendy **${cmdName}**!`);

        const cmdOverride = getCommandOverride(cat, cmdName);
        const currentMerged = (cfg.legacy.commands[cat] && cfg.legacy.commands[cat][cmdName]) ? cfg.legacy.commands[cat][cmdName] : cfg.legacy.defaultCommandConfig;
        
        let opText: string | undefined;
        if (target.type.base == 'user-mention') {
            const userId = target.value.id;
            const currentList = currentMerged.cooldownBypassUsers ?? [];
            if (currentList.includes(userId)) {
                cmdOverride.cooldownBypassUsers = removeElement(currentList, userId);
                opText = 'usunięto';
            } else {
                cmdOverride.cooldownBypassUsers = [...currentList, userId];
                opText = 'dodano';
            }
        } else if (target.type.base == 'role-mention') {
            const roleId = target.value.id;
            const currentList = currentMerged.cooldownBypassRoles ?? [];
            if (currentList.includes(roleId)) {
                cmdOverride.cooldownBypassRoles = removeElement(currentList, roleId);
                opText = 'usunięto';
            } else {
                cmdOverride.cooldownBypassRoles = [...currentList, roleId];
                opText = 'dodano';
            }
        }

        cfg.legacy.commands[cat] ??= {};
        cfg.legacy.commands[cat][cmdName] = deepMerge(currentMerged, cmdOverride);

        saveConfigurationChanges();
        api.log.replySuccess(api, 'Udało się!', `${opText} bypass cooldownu dla **${cmdName}**!`);
    }
};
