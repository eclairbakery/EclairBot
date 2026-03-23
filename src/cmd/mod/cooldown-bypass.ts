import { cfg, getCommandOverride, saveConfigurationChanges } from '@/bot/cfg.ts';
import { Command } from '@/bot/command.ts';
import { CommandFlags } from '@/bot/apis/commands/misc.ts';
import { findCmdConfCategory } from '@/util/cmd/findCmdConfigObj.ts';
import { deepMerge } from '@/util/objects/objects.ts';

import * as dsc from 'discord.js';

function removeElement(arr: dsc.Snowflake[], target: dsc.Snowflake): dsc.Snowflake[] {
    const result = [];
    for (const elem of arr) {
        if (elem != target) {
            result.push(elem);
        }
    }
    return result;
}

export const cooldownBypassCmd: Command = {
    name: 'cooldown-bypass',
    description: {
        main: 'Dodaj użytkownika lub rolę do listy bez cooldownu dla danej komendy.',
        short: 'Dodaj bypass cooldownu.',
    },
    aliases: ['toggle-cooldown-bypass'],
    expectedArgs: [
        {
            name: 'op',
            description: 'Operacja którą chcesz wykonać (add/rem/toggle)',
            type: { base: 'enum', options: ['add', 'rem', 'toggle'] as const },
            optional: true,
        },
        {
            name: 'cmd',
            description: 'komenda dla której nałozyć bypass',
            type: { base: 'command-ref' },
            optional: false,
        },
        {
            name: 'target',
            description: 'użytkownik lub roli do nałożenia bypassa',
            type: {
                base: 'union',
                variants: [
                    { base: 'user-mention', includeRefMessageAuthor: true },
                    { base: 'role-mention' },
                ],
            },
            optional: false,
        },
    ],
    flags: CommandFlags.None,
    permissions: {
        allowedRoles: [cfg.hierarchy.administration.headMod, cfg.hierarchy.administration.admin, cfg.hierarchy.administration.headAdmin, cfg.hierarchy.administration.eclair25],
        allowedUsers: [],
    },

    async execute(api) {
        const op = api.getEnumArg('op', ['add', 'rem', 'toggle'])?.value ?? 'toggle';
        const cmd = api.getTypedArg('cmd', 'command-ref')?.value;
        const target = api.getTypedArg('target', ['user-mention', 'role-mention']);

        const cmdName = cmd.name;
        const cat = findCmdConfCategory(cmdName);

        if (!cat) return api.log.replyError(api, 'Błąd', `Nie znaleziono komendy **${cmdName}**!`);

        const cmdOverride = getCommandOverride(cmdName);
        const currentMerged = (cfg.commands.configuration && cfg.commands.configuration[cmdName]) ? cfg.commands.configuration[cmdName] : cfg.commands.defaultConfiguration;

        let opText: string | undefined;
        if (target.type.base == 'user-mention') {
            const userId = target.value.id;
            const currentList = currentMerged.cooldownBypassUsers ?? [];

            switch (op) {
            case 'add':
                if (currentList.includes(userId)) {
                    return api.log.replyError(api, 'Błąd', 'Ten użytkownik ma już bypass cooldownu dla tej komendy');
                }
                cmdOverride.cooldownBypassUsers = [...currentList, userId];
                opText = 'Dodano';
                break;
            case 'rem':
                if (!currentList.includes(userId)) {
                    return api.log.replyError(api, 'Błąd', 'Ten użytkownik nie ma nawet bypassa cooldownu dla tej komendy');
                }
                cmdOverride.cooldownBypassUsers = removeElement(currentList, userId);
                opText = 'Usunięto';
                break;
            case 'toggle':
                if (currentList.includes(userId)) {
                    cmdOverride.cooldownBypassUsers = removeElement(currentList, userId);
                    opText = 'Usunięto';
                } else {
                    cmdOverride.cooldownBypassUsers = [...currentList, userId];
                    opText = 'Dodano';
                }
                break;
            }
        } else if (target.type.base == 'role-mention') {
            const roleId = target.value.id;
            const currentList = currentMerged.cooldownBypassRoles ?? [];

            switch (op) {
            case 'add':
                if (currentList.includes(roleId)) {
                    return api.log.replyError(api, 'Błąd', 'Ta rola ma już bypass cooldownu dla tej komendy');
                }
                cmdOverride.cooldownBypassRoles = [...currentList, roleId];
                opText = 'Dodano';
                break;
            case 'rem':
                if (!currentList.includes(roleId)) {
                    return api.log.replyError(api, 'Błąd', 'Ta rola nie ma nawet bypassa cooldownu dla tej komendy');
                }
                cmdOverride.cooldownBypassRoles = removeElement(currentList, roleId);
                opText = 'Usunięto';
                break;
            case 'toggle':
                if (currentList.includes(roleId)) {
                    cmdOverride.cooldownBypassRoles = removeElement(currentList, roleId);
                    opText = 'Usunięto';
                } else {
                    cmdOverride.cooldownBypassRoles = [...currentList, roleId];
                    opText = 'Dodano';
                }
                break;
            }
        }

        cfg.commands.configuration ??= {};
        cfg.commands.configuration[cmdName] = deepMerge(currentMerged, cmdOverride);

        saveConfigurationChanges();
        return api.log.replySuccess(
            api, 'Udało się!',
            `${opText} bypass cooldownu **${cmdName}** dla podanego celu!`,
        );
    },
};
