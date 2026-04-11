import { CompilerDriver } from './driver.ts';
import { WandboxCompilerDriver } from './wandbox.ts';
import { ZapCompilerDriver } from './zapc.ts';

import { cfg } from '@/bot/cfg.ts';

function findWandboxCompiler(lang: string): string {
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

export function getCompilerForLang(lang: string): CompilerDriver {
    if (['zap', 'zp', 'zapc'].includes(lang)) {
        return new ZapCompilerDriver({});
    }
    return new WandboxCompilerDriver({ compiler: findWandboxCompiler(lang) });
}
