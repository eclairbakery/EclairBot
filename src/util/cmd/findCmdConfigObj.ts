import { cfg } from "@/bot/cfg.js";
import { Command } from "@/bot/command.js";

type CommandConfigResolvable = {
    enabled: boolean;
    aliases?: string[];
    allowedRoles?: string[] | null;
    allowedUsers?: string[] | null;
    reasonRequired?: boolean;
    [key: string]: any;
};

export function findCmdConfResolvable(commandName: string): CommandConfigResolvable {
    const commands = cfg.commands;

    for (const [category, content] of Object.entries(commands)) {
        if (category === "defConf") continue;
        const cat = content as Record<string, CommandConfigResolvable>;
        if (commandName in cat) return cat[commandName];
    }

    return commands.defConf;
}

export function findCmdConfigObj(command: Command): CommandConfigResolvable {
    return findCmdConfResolvable(command.name);
}

export function findCmdConfigLocation(cmdName: string) {
    const commands = cfg.commands;

    for (const [category, content] of Object.entries(commands)) {
        if (category === "defConf") continue;
        const cat = content as Record<string, CommandConfigResolvable>;
        if (cmdName in cat) {
            return {
                category,
                name: cmdName,
                conf: cat[cmdName] 
            };
        }
    }

    return {
        category: "defConf",
        name: cmdName,
        conf: commands.defConf
    };
}