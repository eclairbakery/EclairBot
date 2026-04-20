import { CompilerDriver } from './driver.ts';
import { GodBoltCompilerDriver } from '@/bot/apis/compile/godbolt.ts';
import { WandboxCompilerDriver } from './wandbox.ts';
import { ZapCompilerDriver } from './zapc.ts';

import { cfg } from '@/bot/cfg.ts';

function findTrueCompilerName(lang: string): string {
    const replaceMap = Object.entries(cfg.features.compilation.replaceCompilerMap);
    const langNormalized = lang.trim().toLowerCase();
    for (const [compiler, aliases] of replaceMap) {
        const compilerNormalized = compiler.toLowerCase();
        if (aliases.includes(langNormalized) || compilerNormalized == langNormalized) {
            return compiler;
        }
    }
    return lang;
}

export async function getCompilerForLang(lang: string): Promise<CompilerDriver> {
    if (['zap', 'zp', 'zapc'].includes(lang)) {
        return new ZapCompilerDriver({});
    }
    if ((await GodBoltCompilerDriver.getSupportedLangList()).includes(lang)) {
        return new GodBoltCompilerDriver(lang);
    }
    return new WandboxCompilerDriver({ compiler: findTrueCompilerName(lang) });
}
