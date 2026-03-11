import JSON5 from 'json5';

import { deepMerge } from '@/util/objects/objects.js';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { Config } from './definitions/config.js';
import { defaultCfg } from './default/config/index.js';

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

export function getCommandOverride(category: string, commandName: string): any {
    if (!overrideCfg.legacy) (overrideCfg as any).legacy = {}; 
    if (!overrideCfg.legacy?.commands) (overrideCfg as any).legacy.commands = {};
    const cmds = overrideCfg.legacy?.commands as any;
    cmds[category] ??= {};
    cmds[category][commandName] ??= {};
    return cmds[category][commandName];
}

function makeConfig(): Config {
    overrideCfg = readConfigurationChanges();
    return deepMerge(defaultCfg, overrideCfg);
};

export const cfg = makeConfig();

export { Config };

