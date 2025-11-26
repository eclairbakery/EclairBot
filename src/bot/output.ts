import { GuildTextBasedChannel } from "discord.js";
import util from "node:util";
import cfg from "@/bot/cfg.js";
import { client } from "@/bot/client.js";
import { TextDecoder, TextEncoder } from "node:util";

const decoder = new TextDecoder();
const encoder = new TextEncoder();

// =======================================================
//  ORIGINAL WRITERS
// =======================================================

const origStdoutWrite = process.stdout.write.bind(process.stdout);
const origStderrWrite = process.stderr.write.bind(process.stderr);

// =======================================================
//  OUTPUT NAMESPACE
// =======================================================

export namespace output {
    export namespace colors {
        export const RESET  = "\x1b[0m";
        export const RED    = "\x1b[31m";
        export const YELLOW = "\x1b[33m";
        export const CYAN   = "\x1b[36m";
    }

    let stdoutChannel: GuildTextBasedChannel | undefined;
    let stderrChannel: GuildTextBasedChannel | undefined;
    let stdwarnChannel: GuildTextBasedChannel | undefined;

    function format(raw: any, ...args: any[]): string {
        let text = util.format(
            typeof raw === "object" ? JSON.stringify(raw, null, 2) : raw,
            ...args
        );
        return text.trimEnd();
    }

    export function decorate(level: "LOG" | "WARN" | "ERR", color: string, text: string) {
        return text
            .split("\n")
            .map((line) => `${colors.RESET}[${color} ${level} ${colors.RESET}] ${line}${colors.RESET}`)
            .join("\n");
    }

    async function send(where: "stdout" | "stderr" | "stdwarn", msg: string) {
        let target: GuildTextBasedChannel | undefined;

        if (where === "stdout") target = stdoutChannel;
        if (where === "stderr") target = stderrChannel;
        if (where === "stdwarn") target = stdwarnChannel;

        if (!target) return;

        try {
            await target.send(
                `at ${where}:\n\`\`\`ansi\n${msg.replace(/```/g, "`[second char]`")}\n\`\`\``
            );
        } catch (e) {
            origStderrWrite(String(e) + "\n");
        }
    }
    export async function init() {
        try {
            stdoutChannel  = await client.channels.fetch(cfg.channels.logs.stdout) as GuildTextBasedChannel;
            stderrChannel  = await client.channels.fetch(cfg.channels.logs.stderr) as GuildTextBasedChannel;
            stdwarnChannel = await client.channels.fetch(cfg.channels.logs.stdwarn) as GuildTextBasedChannel;

            if (stdoutChannel == null)  throw new Error('channel stdout is null');
            if (stderrChannel == null)  throw new Error('channel stderr is null');
            if (stdwarnChannel == null) throw new Error('channel stdwrn is null');

            process.stdout.write = function (chunk: any, encoding?: any, callback?: any): boolean {
                let clean: string | Uint8Array;

                if (typeof chunk === "string") {
                    const trimmed = chunk.trimEnd();
                    if (!trimmed.endsWith("--object-logged")) {
                        output.forward(trimmed);
                    }
                    clean = chunk.replace(/--object-logged/g, "");
                } else if (chunk instanceof Uint8Array) {
                    let str = decoder.decode(chunk);
                    const trimmed = str.trimEnd();
                    if (!trimmed.endsWith("--object-logged")) {
                        output.forward(trimmed);
                    }
                    str = str.replace(/--object-logged/g, "");
                    clean = encoder.encode(str);
                } else {
                    clean = chunk;
                }

                return origStdoutWrite(clean, encoding, callback);
            };

            process.stderr.write = function (chunk: any, encoding?: any, callback?: any): boolean {
                let clean: string | Uint8Array;

                if (typeof chunk === "string") {
                    const trimmed = chunk.trimEnd();
                    if (!trimmed.endsWith("--object-logged")) {
                        output.forward(trimmed);
                    }
                    clean = chunk.replace(/--object-logged/g, "");
                } else if (chunk instanceof Uint8Array) {
                    let str = decoder.decode(chunk);
                    const trimmed = str.trimEnd();
                    if (!trimmed.endsWith("--object-logged")) {
                        output.forward(trimmed);
                    }
                    str = str.replace(/--object-logged/g, "");
                    clean = encoder.encode(str);
                } else {
                    clean = chunk;
                }

                return origStderrWrite(clean, encoding, callback);
            };
        } catch (e) {
            origStderrWrite(`Log init failed: ${e}\n`);
        }
    }

    export function log(msg: any, ...args: any[]) {
        const data = format(msg, ...args);
        const pref = decorate("LOG", colors.CYAN, data);

        process.stdout.write(pref + " --object-logged\n");
        send("stdout", data);
    }

    export function warn(msg: any, ...args: any[]) {
        const data = format(msg, ...args);
        const pref = decorate("WARN", colors.YELLOW, data);

        process.stdout.write(pref + " --object-logged\n");
        send("stdwarn", data);
    }

    export function err(msg: any, ...args: any[]) {
        const data = format(msg, ...args);
        const pref = decorate("ERR", colors.RED, data);

        process.stdout.write(pref + " --object-logged\n");
        send("stderr", data);
    }

    export function forward(raw: string) {
        send("stdout", raw);
    }
}

export const ft = output.colors;
