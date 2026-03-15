import { cfg, overrideCfg, saveConfigurationChanges } from "@/bot/cfg.ts";
import { Command } from "@/bot/command.ts";
import { CommandFlags } from "@/bot/apis/commands/misc.ts";

export const disableCommandCmd: Command = {
    name: "cmd-disable",
    description: {
        main: "Wyłącz komendę. Użyteczne czasami. Często nie.",
        short: "Wyłącza komendę.",
    },
    aliases: [],
    expectedArgs: [
        {
            name: "arg",
            description: "Komenda.",
            type: { base: "command-ref" },
            optional: false,
        },
    ],
    flags: CommandFlags.Important | CommandFlags.Unsafe,
    permissions: {
        allowedRoles: cfg.hierarchy.developers.allowedRoles,
        allowedUsers: cfg.hierarchy.developers.allowedUsers,
    },

    async execute(api) {
        const cmd = api.getTypedArg("arg", "command-ref").value;
        const name = cmd.name;

        if (!overrideCfg.commands) (overrideCfg as any).commands = {};
        if (!overrideCfg.commands?.configuration) (overrideCfg as any).commands.configuration = {};

        overrideCfg!.commands!.configuration! ??= {};
        overrideCfg!.commands!.configuration![name] ??= cfg.commands.defaultConfiguration;
        overrideCfg!.commands!.configuration![name].enabled = false;
        saveConfigurationChanges();

        api.log.replySuccess(api, "Udało się!", `Wyłączono komendę **${name}**!`);
    },
};
