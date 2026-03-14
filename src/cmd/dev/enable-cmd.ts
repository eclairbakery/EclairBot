import { cfg, overrideCfg, saveConfigurationChanges } from "@/bot/cfg.js";
import { Command} from "@/bot/command.js";
import { CommandFlags } from '@/bot/apis/commands/misc.js';
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

        if (!overrideCfg.commands) (overrideCfg as any).commands = {};
        if (!overrideCfg.commands?.configuration) (overrideCfg as any).commands.configuration = {};

        overrideCfg!.commands!.configuration! ??= {};
        overrideCfg!.commands!.configuration![name] ??= cfg.commands.defaultConfiguration;
        overrideCfg!.commands!.configuration![name].enabled = true;
        saveConfigurationChanges();

        api.log.replySuccess(api, 'Udało się!', `Włączono komendę **${name}**!`);
    }
};
