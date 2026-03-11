import { cfg } from '@/bot/cfg.js';
import { Command } from '@/bot/command.js';
import { commands } from '@/cmd/list.js';

import { AnyCommandConfig } from '@/bot/definitions/config-subtypes.js';

export function findCmdConfCategory(commandName: string): string | undefined {
    for (const [category, content] of Object.entries(cfg.legacy.commands)) {
        if (commandName in content) {
            return category;
        }
    }

    for (const [category, cmds] of commands.entries()) {
        if (cmds.some(c => c.name == commandName || c.aliases.includes(commandName))) {
            return category.stringId();
        }
    }
}

export function findCmdConfigObj(command: Command): AnyCommandConfig | undefined {
    const cat = findCmdConfCategory(command.name);
    if (!cat) return undefined;
    return cfg.legacy.commands[cat]?.[command.name];
}

export function findCmdConfigObjOrDefault(command: Command): AnyCommandConfig {
    const cat = findCmdConfCategory(command.name);
    if (!cat) return cfg.legacy.defaultCommandConfig;
    
    const config = cfg.legacy.commands[cat]?.[command.name];
    if (config) return { ...cfg.legacy.defaultCommandConfig, ...config };

    return cfg.legacy.defaultCommandConfig;
}

export function findCmdConfResolvable(commandName: string): AnyCommandConfig {
    const cat = findCmdConfCategory(commandName);
    if (!cat) return cfg.legacy.defaultCommandConfig;
    
    const config = cfg.legacy.commands[cat]?.[commandName];
    if (config) return { ...cfg.legacy.defaultCommandConfig, ...config };

    return cfg.legacy.defaultCommandConfig;
}

