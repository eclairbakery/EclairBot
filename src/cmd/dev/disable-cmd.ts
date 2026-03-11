import { cfg, overrideCfg, saveConfigurationChanges } from "@/bot/cfg.js";
import { Command, CommandFlags } from "@/bot/command.js";
import { findCmdConfCategory } from "@/util/cmd/findCmdConfigObj.js";

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
            type: { base: 'string' },
            optional: false
        },
    ],
    flags: CommandFlags.Important | CommandFlags.Unsafe,
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

        overrideCfg!.commands![cat] ??= {};
        overrideCfg!.commands![cat][name] ??= cfg.defaultCommandConfig;
        overrideCfg!.commands![cat][name].enabled = false;
        saveConfigurationChanges();

        api.log.replySuccess(api, 'Udało się!', `Wyłączono komendę **${name}**!`);
    }
};
