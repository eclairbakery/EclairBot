import { cfg, saveConfigurationChanges } from "@/bot/cfg.js";
import { Command, CommandFlags } from "@/bot/command.js";
import { findCmdConfCategory } from "@/util/cmd/findCmdConfigObj.js";

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
        allowedRoles: cfg.devPerms.allowedRoles,
        allowedUsers: cfg.devPerms.allowedUsers,
    },
    
    async execute(api) {
        const name = api.getTypedArg('arg', 'string')?.value!;
        const cat = findCmdConfCategory(name);

        if (!cat) {
            return api.log.replyError(api, 'Błąd', `Nie znaleziono komendy **${name}**!`);
        }

        cfg.commands[cat] ??= {};
        cfg.commands[cat][name] ??= cfg.defaultCommandConfig;
        cfg.commands[cat][name].enabled = true;

        saveConfigurationChanges();        saveConfigurationChanges();

        api.log.replySuccess(api, 'Udało się!', `Włączono komendę **${name}**!`);
    }
};
