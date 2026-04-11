import { CompilerDriver } from './driver.ts';
import { WandboxCompilerDriver } from './wandbox.ts';

import { cfg } from '@/bot/cfg.ts';

function findCompiler(lang: string): string {
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
    // TODO
    return new WandboxCompilerDriver({ compiler: findCompiler(lang) });
}
