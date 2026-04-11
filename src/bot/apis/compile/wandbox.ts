import { CompilerDriver, CompilerInput, CompilerOutput, CompilerErrorKind } from './driver.ts';

export interface WandboxOptions {
    compiler: string;
    options?: string;
    compilerOptionRaw?: string;
    runtimeOptionRaw?: string;
}

export class WandboxCompiler implements CompilerDriver {
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
            if (exitcode !== 0 && data.compiler_error && (!data.program_output && !data.program_error)) {
                return {
                    ok: false,
                    errKind: CompilerErrorKind.Compile,
                    errMessage: data.compiler_error,
                };
            }

            return {
                ok: true,
                stdout: data.program_output ?? '',
                stderr: (data.compiler_error ?? '') + (data.program_error ?? ''),
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
