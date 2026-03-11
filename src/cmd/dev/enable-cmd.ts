import { cfg, overrideCfg, saveConfigurationChanges } from "@/bot/cfg.js";
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
            type: { base: 'command-ref' },
            optional: false
        },
    ],
    flags: CommandFlags.Important,
    permissions: {
        allowedRoles: cfg.hierarchy.developers.allowedRoles,
        allowedUsers: cfg.hierarchy.developers.allowedUsers,
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
        overrideCfg!.legacy!.commands![cat][name].enabled = true;
        saveConfigurationChanges();

        api.log.replySuccess(api, 'Udało się!', `Włączono komendę **${name}**!`);
    }
};
