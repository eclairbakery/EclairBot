import { CompilerDriver } from './driver.ts';
import { GodBoltCompilerDriver } from '@/bot/apis/compile/godbolt.ts';
import { WandboxCompilerDriver } from './wandbox.ts';
import { ZapCompilerDriver } from './zapc.ts';

import { cfg } from '@/bot/cfg.ts';

const getReplaceMap = () => cfg.features.compilation.replaceCompilerMap;

function findWandboxCompilerName(lang: string): string {
    const replaceMap = Object.entries(getReplaceMap());
    const langNormalized = lang.trim().toLowerCase();
    for (const [compiler, aliases] of replaceMap) {
        const compilerNormalized = compiler.toLowerCase();
        if (aliases.includes(langNormalized) || compilerNormalized == langNormalized) {
            return compiler;
        }
    }
    return lang;
}

async function isWandbox(lang: string): Promise<boolean> {
    const available = await WandboxCompilerDriver.fetchCompilerNames();
    const isInReplaceMap = Object.values(getReplaceMap()).some(s => s.includes(lang));
    return available.includes(lang) || isInReplaceMap;
}

export async function getCompilerForLang(lang: string): Promise<CompilerDriver> {
    if (['zap', 'zp', 'zapc'].includes(lang)) {
        return new ZapCompilerDriver({});
    }
    if (await isWandbox(lang)) {
        return new WandboxCompilerDriver({ compiler: findWandboxCompilerName(lang) });
    }
    return new GodBoltCompilerDriver(lang);
}
