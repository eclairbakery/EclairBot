import JSON5 from 'json5';

import { deepMerge } from '@/util/objects/objects.ts';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { Config } from './definitions/config/config.ts';
import { defaultCfg } from './default/config/index.ts';

export let overrideCfg: Partial<Config> = {};

function readConfigurationChanges() {
    if (!existsSync('bot/config.js')) return {};
    let file = readFileSync('bot/config.js', 'utf-8');
    file = file.trim();
    while (file.startsWith('(')) file = file.slice(1);
    while (file.endsWith(')')) file = file.slice(0, -1);
    return JSON5.parse(file);
}

export function saveConfigurationChanges() {
    writeFileSync('bot/config.js', `(${JSON5.stringify(overrideCfg, null, 4)})`, 'utf-8');
}

export function getCommandOverride(commandName: string): any {
    if (!overrideCfg.commands) {
        (overrideCfg as any).legacy.commands = {};
    }

    if (!overrideCfg.commands!.configuration) {
        (overrideCfg as any).legacy.commands.configuration = {};
    }

    const cmds = overrideCfg.commands!.configuration as any;
    cmds[commandName] ??= {};
    return cmds[commandName];
}

function makeConfig(): Config {
    overrideCfg = readConfigurationChanges();
    return deepMerge(defaultCfg, overrideCfg);
}

export const cfg = makeConfig();

export type { Config };
