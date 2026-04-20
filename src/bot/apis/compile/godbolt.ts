import { CompilerDriver, CompilerErrorKind, CompilerInfo, CompilerInput, CompilerOutput } from '@/bot/apis/compile/driver.ts';

interface GodBoltLanguageListEntry {
    id: string;
    name: string;
    monaco: string;
};

interface GodBoltCompilerListEntry {
    id: string;
    lang: string;
};

export class GodBoltCompilerDriver implements CompilerDriver {
    private lang: string;

    constructor (lang: string) {
        this.lang = lang;
    }

    static async getResponse<T>(url: string, body?: object): Promise<T> {
        const fetched = await fetch(url, {
            headers: {
                accept: "application/json",
                "Content-Type": "application/json"
            },
            ...(body ? { method: 'POST', body: JSON.stringify(body) } : {})
        });
        let result = await fetched.text();
        if (result.startsWith("'")) result = result.slice(1);
        if (result.endsWith("'"))   result = result.slice(0, -1);
        return JSON.parse(result);
    }

    static async getSupportedLangList(): Promise<string[]> {
        const languages = await this.getResponse<GodBoltLanguageListEntry[]>('https://godbolt.org/api/languages');
        const result: string[] = [];
        
        for (const lang of languages) {
            if (result.includes(lang.id)) continue;
            result.push(lang.id);
        }

        const compilers = await this.getResponse<GodBoltCompilerListEntry[]>('https://godbolt.org/api/compilers');
        for (const compiler of compilers) {
            if (result.includes(compiler.id)) continue;
            result.push(compiler.id);
        }

        return result;
    }

    async getGodboltCompiler(): Promise<string> {
        const compilers = await GodBoltCompilerDriver.getResponse<GodBoltCompilerListEntry[]>('https://godbolt.org/api/compilers');
        const compiler =
            compilers.find(c =>
                c.lang === this.lang &&
                (c.lang == 'c' ? (c.id.includes("gcc") || c.id.includes("clang")) : true) &&
                !c.id.includes("risc") &&
                !c.id.includes("arm") &&
                !c.id.includes("avr") &&
                !c.id.includes("mips")
            )
        if (!compiler?.id) return 'unknown';
        return compiler.id;
    }

    async info(): Promise<CompilerInfo> {
        return {
            lang: (await this.getGodboltCompiler()) == 'unknown'
                ? 'unknown' : this.lang, // TODO: do this better
            version: "1.0.0", // TODO: get actual version
            backend: "Godbolt",
            displayName: this.lang
        };
    }

    async compile(input: CompilerInput): Promise<CompilerOutput> {
        try {
            const compiler = await this.getGodboltCompiler();

            const body = {
                allowStoreCodeDebug: false,
                bypassCache: 0,
                compiler, files: [],
                lang: this.lang,
                options: {
                    executeParameters: {
                        args: [],
                        stdin: input.stdin
                    },
                    userArguments: "",
                    compilerOptions: {
                          skipAsm: false,
                          executorRequest: true,
                          overrides: []
                    },
                    filters: {
                         binary: false,
                         binaryObject: false,
                         commentOnly: true,
                         demangle: true,
                         directives: true,
                         execute: true,
                         intel: true,
                         labels: true,
                         libraryCode: false,
                         trim: false,
                         debugCalls: false
                    },
                    tools: [],
                    libraries: [],
                },
                source: input.source
            };

            const result = await GodBoltCompilerDriver.getResponse<{
                stdout: { text: string }[],
                stderr: { text: string }[],
                code: number
            }>('https://godbolt.org/api/compiler/' + compiler + '/compile', body);

            return {
                ok: true,
                stdout: result.stdout.map((t) => t.text).join('\n'),
                stderr: result.stderr.map((t) => t.text).join('\n'),
                exitcode: result.code
            };
        } catch (err: unknown) {
            return {
                ok: false,
                errKind: CompilerErrorKind.Internal,
                errMessage: err instanceof Error ? err.message : String(err) 
            };
        }
    }
}
