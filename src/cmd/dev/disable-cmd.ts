import { cfg, saveConfigurationChanges } from "@/bot/cfg.js";
import { Command, CommandFlags } from "@/bot/command.js";
import { findCmdConfResolvable } from "@/util/cmd/findCmdConfigObj.js";

export const disableCommandCmd: Command = {
    name: 'cmd-disable',
    description: {
        main: 'Wyłącz komendę. Użyteczne czasami. Często nie.',
        short: 'Wyłącza komendę.'
    },
    aliases: [],
    expectedArgs: [
        {
            name: 'arg',
            description: 'Komenda.',
            type: 'string',
            optional: false
        },
    ],
    flags: CommandFlags.Important,
    permissions: {
        discordPerms: [],
        allowedRoles: cfg.devPerms.allowedRoles,
        allowedUsers: cfg.devPerms.allowedUsers,
    },
    
    async execute(api) {
        let where = findCmdConfResolvable(api.getTypedArg('arg', 'string')?.value ?? 'siema');
        if (!where || !where.enabled) {
            where = { enabled: false };
        } else {
            where.enabled = false;
        }
        saveConfigurationChanges();
    }
};