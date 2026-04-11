import { CompilerDriver, CompilerInput, CompilerOutput, CompilerErrorKind, CompilerInfo } from './driver.ts';

export interface WandboxOptions {
    compiler: string;
    options?: string;
    compilerOptionRaw?: string;
    runtimeOptionRaw?: string;
}

interface WandboxCompiler {
    name: string;
    language: string;
    version: string;
    'display-name'?: string;

    'compiler-option-raw'?: boolean;
    'runtime-option-raw'?: boolean;

    switches?: unknown[];
};

export class WandboxCompilerDriver implements CompilerDriver {
    private readonly compiler: string;
    private readonly options: string;
    private readonly compilerOptionRaw: string;
    private readonly runtimeOptionRaw: string;

    constructor(config: WandboxOptions) {
        this.compiler = config.compiler;
        this.options = config.options ?? '';
        this.compilerOptionRaw = config.compilerOptionRaw ?? '';
        this.runtimeOptionRaw = config.runtimeOptionRaw ?? '';
    }

    async info(): Promise<CompilerInfo> {
        const response = await fetch('https://wandbox.org/api/list.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch compiler list: ${response.status} ${response.statusText}`);
        }

        const compilers = await response.json() as WandboxCompiler[];

        const compiler = compilers.find((c) => c.name === this.compiler);
        if (!compiler) {
            return {
                lang: 'unknown',
                displayName: this.compiler,
                version: 'unknown',
            };
        }

        return {
            lang: compiler.language,
            displayName: compiler['display-name'] ?? compiler.name,
            version: compiler.version,
        };
    }

    async compile(input: CompilerInput): Promise<CompilerOutput> {
        try {
            const body = {
                compiler: this.compiler,
                code: input.source,
                stdin: input.stdin,
                options: this.options,
                'compiler-option-raw': this.compilerOptionRaw,
                'runtime-option-raw': this.runtimeOptionRaw,
                save: false,
            };

            const response = await fetch('https://wandbox.org/api/compile.json', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                return {
                    ok: false,
                    errKind: CompilerErrorKind.Internal,
                    errMessage: `Wandbox API error: ${response.status} ${response.statusText}`,
                };
            }

            const data = await response.json();

            if (data.error) {
                return {
                    ok: false,
                    errKind: CompilerErrorKind.Internal,
                    errMessage: data.error,
                };
            }

            if (data.signal === 'Killed' || data.signal === 'SIGKILL' || data.status === '137' || data.status === '124') {
                return {
                    ok: false,
                    errKind: CompilerErrorKind.Timeout,
                    errMessage: 'Execution timed out or exceeded resource limits',
                };
            }

            const exitcode = parseInt(data.status ?? '0', 10);
            const compileLog: string =
                data.compiler_message ?? `${data.compiler_output ?? ''}${data.compiler_error ?? ''}`;

            if (
                exitcode !== 0
                && compileLog.trim()
                && !(data.program_output ?? '').trim()
                && !(data.program_error ?? '').trim()
            ) {
                return {
                    ok: false,
                    errKind: CompilerErrorKind.Compile,
                    errMessage: compileLog.trimEnd(),
                };
            }

            return {
                ok: true,
                stdout: data.program_output ?? '',
                stderr: compileLog + (data.program_error ?? ''),
                exitcode,
            };
        } catch (error: unknown) {
            return {
                ok: false,
                errKind: CompilerErrorKind.Internal,
                errMessage: error instanceof Error ? error.message : String(error),
            };
        }
    }
}
