import {
    CompilerDriver, CompilerErrorKind,
    CompilerInfo, CompilerInput, CompilerOutput,
} from './driver.ts';

import process from 'node:process';

export interface ZapCompilerDriverOptions {
    baseUrl?: string;
}

interface ZapcEvent {
    type: string;
    data: string
};

function normalizeBaseUrl(url: string): string {
    return url.replace(/\/+$/, '');
}

function collectCompilerMessages(events: ZapcEvent[]): { error: string | null; logs: string[] } {
    let error: string | null = null;
    const logs: string[] = [];
    for (const e of events) {
        if (e.type == 'compiler_error') {
            error = e.data;
            break;
        }
        if (e.type == 'compiler_log' && e.data) {
            logs.push(e.data);
        }
    }
    return { error, logs };
}

function splitCompileRun(events: ZapcEvent[]): { compile: ZapcEvent[]; run: ZapcEvent[] } {
    const idx = events.findIndex((e) => e.type == 'stdout' || e.type == 'stderr');
    if (idx == -1) {
        return { compile: events, run: [] };
    }
    return { compile: events.slice(0, idx), run: events.slice(idx) };
}

export class ZapCompilerDriver implements CompilerDriver {
    private readonly baseUrl: string;

    constructor(options: ZapCompilerDriverOptions) {
        const baseUrl = options.baseUrl ?? process.env.EB_ZAPC_BASE_URL;
        if (!baseUrl) {
            throw new Error('No zapc api base url provided');
        }
        this.baseUrl = normalizeBaseUrl(baseUrl);
    }

    async info(): Promise<CompilerInfo> {
        return {
            lang: 'zap',
            displayName: 'Zap',
            version: 'Zap Compiler Service',
        };
    }

    async compile(input: CompilerInput): Promise<CompilerOutput> {
        try {
            const response = await fetch(`${this.baseUrl}/compile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: input.source }), // TODO: stdin is ignored for now
            });

            if (response.status == 429) {
                return {
                    ok: false,
                    errKind: CompilerErrorKind.Internal,
                    errMessage: 'Compiler service is busy (429). Try again shortly.',
                };
            }

            const text = await response.text();
            let events: ZapcEvent[];
            try {
                events = JSON.parse(text) as ZapcEvent[];
            } catch {
                return {
                    ok: false,
                    errKind: CompilerErrorKind.Internal,
                    errMessage: `Invalid JSON from Zap service (${response.status}): ${text.slice(0, 200)}`,
                };
            }

            if (!Array.isArray(events)) {
                return {
                    ok: false,
                    errKind: CompilerErrorKind.Internal,
                    errMessage: 'Zap service returned a non-array JSON body',
                };
            }

            if (!response.ok) {
                const msg = events
                    .map((e) => (typeof e.data == 'string' ? e.data : JSON.stringify(e)))
                    .join('\n')
                    .trim();
                return {
                    ok: false,
                    errKind: CompilerErrorKind.Internal,
                    errMessage: msg || `Zap service error: ${response.status} ${response.statusText}`,
                };
            }

            const { compile: compilePhase, run: runEvents } = splitCompileRun(events);
            const { error, logs } = collectCompilerMessages(compilePhase);

            if (error !== null) {
                return {
                    ok: false,
                    errKind: CompilerErrorKind.Compile,
                    errMessage: error.trimEnd(),
                };
            }

            let stdout = '';
            let stderr = logs.join('');
            for (const e of runEvents) {
                if (e.type == 'stdout' && e.data) {
                    stdout += e.data;
                } else if (e.type == 'stderr' && e.data) {
                    stderr += e.data;
                }
            }

            return {
                ok: true,
                stdout,
                stderr,
                exitcode: 0,
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
