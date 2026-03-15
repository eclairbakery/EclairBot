import { cfg } from '@/bot/cfg.ts';
import { Command } from '@/bot/command.ts';
import { commands } from '@/cmd/list.ts';

import { AnyCommandConfig } from '@/bot/definitions/config/subtypes.ts';

export function findCmdConfCategory(commandName: string): string | undefined {
    for (const [category, content] of Object.entries(cfg.commands.configuration)) {
        if (commandName in content) {
            return category;
        }
    }

    for (const [category, cmds] of commands.entries()) {
        if (cmds.some((c) => c.name == commandName || c.aliases.includes(commandName))) {
            return category.stringId();
        }
    }
}

export function findCmdConfigObj(command: Command): AnyCommandConfig | undefined {
    const cat = findCmdConfCategory(command.name);
    if (!cat) return undefined;
    return cfg.commands.configuration?.[command.name];
}

export function findCmdConfigObjOrDefault(command: Command): AnyCommandConfig {
    const cat = findCmdConfCategory(command.name);
    if (!cat) return cfg.commands.defaultConfiguration;

    const config = cfg.commands.configuration?.[command.name];
    if (config) return { ...cfg.commands.defaultConfiguration, ...config };

    return cfg.commands.defaultConfiguration;
}

export function findCmdConfResolvable(commandName: string): AnyCommandConfig {
    const cat = findCmdConfCategory(commandName);
    if (!cat) return cfg.commands.defaultConfiguration;

    const config = cfg.commands.configuration?.[commandName];
    if (config) return { ...cfg.commands.defaultConfiguration, ...config };

    return cfg.commands.defaultConfiguration;
}
