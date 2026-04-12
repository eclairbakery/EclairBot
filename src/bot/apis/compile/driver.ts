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

export interface CompilerInfo {
    lang: string;
    displayName: string;
    version: string;
    backend: string;
}

export interface CompilerDriver {
    info(): Promise<CompilerInfo>;
    compile(input: CompilerInput): Promise<CompilerOutput>;
}
