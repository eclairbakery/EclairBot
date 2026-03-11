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
            type: { base: 'command-ref' },
            optional: false
        },
    ],
    flags: CommandFlags.Important | CommandFlags.Unsafe,
    permissions: {
        allowedRoles: cfg.legacy.devPerms.allowedRoles,
        allowedUsers: cfg.legacy.devPerms.allowedUsers,
    },
    
    async execute(api) {
        const cmd = api.getTypedArg('arg', 'command-ref').value;
        const name = cmd.name;
        const cat = findCmdConfCategory(name);

        if (!cat) {
            return api.log.replyError(api, 'Błąd', `Nie znaleziono kategorii dla komendy **${name}**!`);
        }

        if (!overrideCfg.legacy) (overrideCfg as any).legacy = {};

        overrideCfg!.legacy!.commands![cat] ??= {};
        overrideCfg!.legacy!.commands![cat][name] ??= cfg.legacy.defaultCommandConfig;
        overrideCfg!.legacy!.commands![cat][name].enabled = false;
        saveConfigurationChanges();

        api.log.replySuccess(api, 'Udało się!', `Wyłączono komendę **${name}**!`);
    }
};
