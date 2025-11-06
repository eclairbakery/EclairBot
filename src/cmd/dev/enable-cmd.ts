import { cfg, saveConfigurationChanges } from "@/bot/cfg.js";
import { Command, CommandFlags } from "@/bot/command.js";
import { findCmdConfigLocation, findCmdConfResolvable } from "@/util/cmd/findCmdConfigObj.js";

export const enableCommandCmd: Command = {
    name: 'cmd-enable',
    description: {
        main: 'Włącz komendę. Użyteczne czasami. Często nie.',
        short: 'Włącza komendę.'
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
        const name = api.getTypedArg('arg', 'string')?.value!;
        const found = findCmdConfigLocation(name);

        if (found.category === "defConf") {
            cfg.commands.customs ??= {};
            cfg.commands.customs[name] = { enabled: true };
        } else {
            found.conf.enabled = true;
        }

        saveConfigurationChanges();

        api.log.replySuccess(api.msg, 'Udało się!', `Włączono komendę **${name}**!`);
    }
};