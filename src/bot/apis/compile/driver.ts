export interface CompilerInput {
    source: string;
    stdin: string;
}

export type CompilerOutput =
    | { ok: true, stdout: string, stderr: string, exitcode: number }
    | { ok: false, error: string };

export interface CompilerDriver {
    compile(input: CompilerInput): CompilerOutput;
}
