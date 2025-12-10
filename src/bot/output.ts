import { GuildTextBasedChannel } from "discord.js";
import util from "node:util";
import cfg from "@/bot/cfg.js";
import { client } from "@/bot/client.js";

type Nullable<T> = T | undefined | null;

export namespace output {
    export namespace colors {
        export const RESET  = "\x1b[0m";
        export const RED    = "\x1b[31m";
        export const YELLOW = "\x1b[33m";
        export const CYAN   = "\x1b[36m";
    }

    let stdoutChannel: Nullable<GuildTextBasedChannel>;
    let stderrChannel: Nullable<GuildTextBasedChannel>;
    let stdwarnChannel: Nullable<GuildTextBasedChannel>;

    function format(raw: any, ...args: any[]): string {
        return util.format(
            typeof raw === "object" ? JSON.stringify(raw, null, 2) : raw,
            ...args
        ).trimEnd();
    }

    export function decorate(level: "LOG" | "WRN" | "ERR", color: string, text: string) {
        return text
            .split("\n")
            .map(line => `${colors.RESET}[${color} ${level} ${colors.RESET}] ${line}${colors.RESET}`)
            .join("\n");
    }

    async function send(where: "stdout" | "stderr" | "stdwarn", msg: string) {
        let target;

        if (where === "stdout") target = stdoutChannel;
        if (where === "stderr") target = stderrChannel;
        if (where === "stdwarn") target = stdwarnChannel;

        if (!target) return;

        try {
            await target.send(
                `at ${where}:\n\`\`\`ansi\n${msg.replace(/```/g, "`[second char]`")}\n\`\`\``
            );
        } catch (e) {
            console.error("Failed to send log to Discord:", e);
        }
    }

    export async function init() {
        try {
            stdoutChannel  = client.channels.cache.has(cfg.channels.logs.stdout) ? await client.channels.fetch(cfg.channels.logs.stdout) as GuildTextBasedChannel : null;
            stderrChannel  = client.channels.cache.has(cfg.channels.logs.stderr) ? await client.channels.fetch(cfg.channels.logs.stderr) as GuildTextBasedChannel : null;
            stdwarnChannel = client.channels.cache.has(cfg.channels.logs.stdwarn) ? await client.channels.fetch(cfg.channels.logs.stdwarn) as GuildTextBasedChannel : null;

            if (!stdoutChannel)  throw new Error("stdout channel missing");
            if (!stderrChannel)  throw new Error("stderr channel missing");
            if (!stdwarnChannel) throw new Error("stdwarn channel missing");

        } catch (e) {
            console.error(decorate("WRN", ft.RED, "Log init failed: " + JSON.stringify(e, null, 4)));
        }
    }

    export function log(msg: any, ...args: any[]) {
        const data = format(msg, ...args);
        const decorated = decorate("LOG", colors.CYAN, data);
        console.log(decorated);
        send("stdout", data);
    }

    export function warn(msg: any, ...args: any[]) {
        const data = format(msg, ...args);
        const decorated = decorate("WRN", colors.YELLOW, data);
        console.warn(decorated);
        send("stdwarn", data);
    }

    export function err(msg: any, ...args: any[]) {
        const data = format(msg, ...args);
        const decorated = decorate("ERR", colors.RED, data);
        console.error(decorated);
        send("stderr", data);
    }

    export function forward(text: string) {
        console.log(text);
        send("stdout", text);
    }
}

export const ft = output.colors;
