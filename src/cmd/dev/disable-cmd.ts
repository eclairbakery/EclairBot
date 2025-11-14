import { cfg, saveConfigurationChanges } from "@/bot/cfg.js";
import { Command, CommandFlags } from "@/bot/command.js";
import { findCmdConfigLocation, findCmdConfResolvable } from "@/util/cmd/findCmdConfigObj.js";

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
    flags: CommandFlags.Important | CommandFlags.Unsafe,
    permissions: {
        discordPerms: [],
        allowedRoles: cfg.devPerms.allowedRoles,
        allowedUsers: cfg.devPerms.allowedUsers,
    },
    
    async execute(api) {
        const name = api.getTypedArg('arg', 'string')?.value!;
        const found = findCmdConfigLocation(name);

        if (found.category === "defConf") {
            cfg.commands.customs ??= {};
            cfg.commands.customs[name] = { enabled: false };
        } else {
            found.conf.enabled = false;
        }

        saveConfigurationChanges();

        api.log.replySuccess(api.msg, 'Udało się!', `Wyłączono komendę **${name}**!`);
    }
};