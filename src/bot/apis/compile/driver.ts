export interface CompilerInput {
    source: string;
    stdin: string;
}

export enum CompilerErrorKind {
    Compile,
    Timeout,
    Internal,
};

export type CompilerOutput =
    | { ok: true, stdout: string, stderr: string, exitcode: number }
    | { ok: false, errKind: CompilerErrorKind, errMessage: string };

export interface CompilerDriver {
    compile(input: CompilerInput): CompilerOutput;
}
