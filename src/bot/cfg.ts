import { deepMerge } from '@/utils/objects/deepMerge.js';
import * as JSON5 from 'json5';
import * as fs from 'fs';
import type { BotConfig } from './defs/config.js';
import { defaultCfg } from './defaults/config.js';

function isConfigValid(obj: object): obj is BotConfig {
    // can be implemented in the future
    return true;
};

function getOverrideCfg(): object {
    if (!fs.existsSync('build')) {
        fs.mkdirSync('build');
    }
    if (!fs.existsSync('build/config.js')) {
        return {};
    }
    return JSON5.parse(fs.readFileSync('build/config.js', 'utf-8'));
}

function initConfig(): BotConfig {
    const overrideCfg = getOverrideCfg();
    return deepMerge<BotConfig>(defaultCfg, isConfigValid(overrideCfg) ? overrideCfg : {});
}

const cfg = initConfig();

export default cfg;