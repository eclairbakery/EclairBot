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

export const cmdBlockCmd: Command = {
    name: 'cmd-block',
    description: {
        main: 'Zablokuj komuś możliwość używania danej komendy.',
        short: 'Zablokuj komendę dla kogoś',
    },
    aliases: ['toggle-cmd-block'],
    expectedArgs: [
        {
            name: 'op',
            description: 'Operacja którą chcesz wykonać (add/rem/toggle)',
            type: { base: 'enum', options: ['add', 'rem', 'toggle'] as const },
            optional: true,
        },
        {
            name: 'cmd',
            description: 'komenda którą chcesz zablokować',
            type: { base: 'command-ref' },
            optional: false,
        },
        {
            name: 'target',
            description: 'użytkownik lub rola do zablokowania/odblokowania',
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
            const currentList = currentMerged.disallowedUsers ?? [];
            switch (op) {
                case 'add':
                    if (currentList.includes(userId)) {
                        return api.log.replyError(api, 'Błąd', 'Ta komenda jest już zablokowana dla tego użytkownika');
                    }
                    cmdOverride.disallowedUsers = [...currentList, userId];
                    opText = 'Zablokowano';
                    break;
                case 'rem':
                    if (!currentList.includes(userId)) {
                        return api.log.replyError(api, 'Błąd', 'Ta komenda nie jest nawet zablokowana dla tego użytkownika');
                    }
                    cmdOverride.disallowedUsers = removeElement(currentList, userId);
                    opText = 'Odblokowano';
                    break;
                case 'toggle':
                    if (currentList.includes(userId)) {
                        cmdOverride.disallowedUsers = removeElement(currentList, userId);
                        opText = 'Odblokowano';
                    } else {
                        cmdOverride.disallowedUsers = [...currentList, userId];
                        opText = 'Zablokowano';
                    }
                    break;
            }
        } else if (target.type.base == 'role-mention') {
            const roleId = target.value.id;
            const currentList = currentMerged.disallowedRoles ?? [];
            switch (op) {
                case 'add':
                    if (currentList.includes(roleId)) {
                        return api.log.replyError(api, 'Błąd', 'Ta komenda jest już zablokowana dla tej roli');
                    }
                    cmdOverride.disallowedRoles = [...currentList, roleId];
                    opText = 'Zablokowano';
                    break;
                case 'rem':
                    if (!currentList.includes(roleId)) {
                        return api.log.replyError(api, 'Błąd', 'Ta komenda nie jest nawet zablokowana dla tej roli');
                    }
                    cmdOverride.disallowedRoles = removeElement(currentList, roleId);
                    opText = 'Odblokowano';
                    break;
                case 'toggle':
                    if (currentList.includes(roleId)) {
                        cmdOverride.disallowedRoles = removeElement(currentList, roleId);
                        opText = 'Odblokowano';
                    } else {
                        cmdOverride.disallowedRoles = [...currentList, roleId];
                        opText = 'Zablokowano';
                    }
                    break;
            }
        }

        cfg.commands.configuration ??= {};
        cfg.commands.configuration[cmdName] = deepMerge(currentMerged, cmdOverride);

        saveConfigurationChanges();
        api.log.replySuccess(api, 'Udało się!', `**${opText}** dostęp do komendy **${cmdName}** dla podanego celu!`);
    },
};
