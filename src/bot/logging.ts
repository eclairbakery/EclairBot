import { GuildTextBasedChannel } from "discord.js";
import util from "node:util";
import { cfg } from "./cfg.js";
import { client } from "@/client.js";
import { TextDecoder, TextEncoder } from "node:util";

const decoder = new TextDecoder();
const encoder = new TextEncoder();

const origWrite = process.stdout.write.bind(process.stdout);

process.stdout.write = function (
    chunk: any,
    encoding?: any,
    callback?: any
): boolean {
    let data: string | Uint8Array;

    if (typeof chunk === "string") {
        const trimmed = chunk.trimEnd();
        if (!trimmed.endsWith("--object-logged")) {
            output.forward(trimmed);
        }
        data = chunk.replaceAll("--object-logged", "");
    } else if (chunk instanceof Uint8Array) {
        let str = decoder.decode(chunk);
        const trimmed = str.trimEnd();
        if (!trimmed.endsWith("--object-logged")) {
            output.forward(trimmed);
        }
        str = str.replaceAll("--object-logged", "");
        data = encoder.encode(str);
    } else {
        data = chunk;
    }

    return origWrite(data, encoding, callback);
} as typeof process.stdout.write;

const origErrWrite = process.stderr.write.bind(process.stderr);

process.stderr.write = function (
    chunk: any,
    encoding?: any,
    callback?: any
): boolean {
    let data: string | Uint8Array;

    if (typeof chunk === "string") {
        const trimmed = chunk.trimEnd();
        if (!trimmed.endsWith("--object-logged")) {
            output.forward(trimmed);
        }
        data = chunk.replaceAll("--object-logged", "");
    } else if (chunk instanceof Uint8Array) {
        let str = decoder.decode(chunk);
        const trimmed = str.trimEnd();
        if (!trimmed.endsWith("--object-logged")) {
            output.forward(trimmed);
        }
        str = str.replaceAll("--object-logged", "");
        data = encoder.encode(str);
    } else {
        data = chunk;
    }

    return origErrWrite(data, encoding, callback);
} as typeof process.stderr.write;

export namespace output {
    export namespace colors {
        export const RESET   = "\x1b[0m";
        export const RED     = "\x1b[31m";
        export const YELLOW  = "\x1b[33m";
        export const CYAN    = "\x1b[36m";
    }

    let stdoutChannel: GuildTextBasedChannel;
    let stderrChannel: GuildTextBasedChannel;
    let stdwarnChannel: GuildTextBasedChannel;

    // --- helpers ---
    function format(raw: any, ...args: any[]): string {
        let text = util.format(typeof raw === "object" ? JSON.stringify(raw) : raw, ...args);
        if (!text.endsWith("\n")) text += "\n";
        return text.trimEnd();
    }

    function decorate(level: "LOG" | "WARN" | "ERR", color: string, msg: string): string {
        return msg
            .split("\n")
            .map(line => `${colors.RESET}[${color} ${level} ${colors.RESET}] ${line}${colors.RESET}`)
            .join("\n");
    }

    async function send(where: "stdout" | "stderr" | "stdwarn", msg: string) {
        let target: GuildTextBasedChannel | undefined;
        switch (where) {
            case "stdout": target = stdoutChannel; break;
            case "stderr": target = stderrChannel; break;
            case "stdwarn": target = stdwarnChannel; break;
        }
        if (target) {
            try {
                await target.send(`at ${where}:\n\`\`\`ansi\n${msg.replaceAll("```", "`[second char]`")}\`\`\``);
            } catch {}
        }
    }

    // --- public ---
    export async function init() {
        try {
            stdoutChannel = await client.channels.fetch(cfg.logs.stdout) as GuildTextBasedChannel;
            stderrChannel = await client.channels.fetch(cfg.logs.stderr) as GuildTextBasedChannel;
            stdwarnChannel = await client.channels.fetch(cfg.logs.stdwarn) as GuildTextBasedChannel;
        } catch {}
    }

    export function log(msg: any, ...args: any[]) {
        const data = format(msg, ...args);
        const prefixed = decorate("LOG", colors.CYAN, data);
        console.log(prefixed + " --object-logged");
        send("stdout", data);
    }

    export function warn(msg: any, ...args: any[]) {
        const data = format(msg, ...args);
        const prefixed = decorate("WARN", colors.YELLOW, data);
        console.warn(prefixed + " --object-logged");
        send("stdwarn", data);
    }

    export function err(msg: any, ...args: any[]) {
        const data = format(msg, ...args);
        const prefixed = decorate("ERR", colors.RED, data);
        console.error(prefixed + " --object-logged");
        send("stderr", data);
    }

    export function forward(raw: string) {
        send("stdout", raw);
    }
}

export const ft = output.colors;