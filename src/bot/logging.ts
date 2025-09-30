import { GuildTextBasedChannel, Snowflake } from "discord.js";
import util from "node:util";
import { cfg } from "./cfg.js";
import { client } from "@/client.js";

export namespace output {
    export namespace colors {
        export const RESET   = "\x1b[0m";

        export const BLACK   = "\x1b[30m";
        export const RED     = "\x1b[31m";
        export const GREEN   = "\x1b[32m";
        export const YELLOW  = "\x1b[33m";
        export const BLUE    = "\x1b[34m";
        export const MAGENTA = "\x1b[35m";
        export const CYAN    = "\x1b[36m";
        export const WHITE   = "\x1b[37m";

        export const BRIGHT_BLACK   = "\x1b[90m";
        export const BRIGHT_RED     = "\x1b[91m";
        export const BRIGHT_GREEN   = "\x1b[92m";
        export const BRIGHT_YELLOW  = "\x1b[93m";
        export const BRIGHT_BLUE    = "\x1b[94m";
        export const BRIGHT_MAGENTA = "\x1b[95m";
        export const BRIGHT_CYAN    = "\x1b[96m";
        export const BRIGHT_WHITE   = "\x1b[97m";
    }

    function mkFormat(): (rawtext: any, ...data: any[]) => string {
        return function (rawtext: any, ...data: any[]): string {
            let text = util.format(rawtext, ...data);

            if (!text.endsWith("\n")) {
                text += "\n";
            }

            return text;
        };
    }

    let formatter = mkFormat();
    let stdoutChannel: GuildTextBasedChannel;
    let stderrChannel: GuildTextBasedChannel;

    function logger(where: 'stdout' | 'stderr' | 'stdwarn', formattedMsg: string) {
        let msg = `at ${where}:\n\`\`\`ansi\n${formattedMsg.replaceAll('```', '`[second char]`')}\`\`\``;
        let targetChan: GuildTextBasedChannel;
        switch (where) {
            case 'stderr':
                targetChan = stderrChannel;
                break;
            case 'stdout':
                targetChan = stdoutChannel;
                break;
            case 'stdwarn':
                targetChan = stderrChannel;
                break;
        }
        targetChan.send(msg);
    }

    export async function init() {
        try {
            stdoutChannel = await client.channels.fetch(cfg.logs.stdout) as GuildTextBasedChannel;
            stderrChannel = await client.channels.fetch(cfg.logs.stderr) as GuildTextBasedChannel;
        } catch {}
    }

    export function warn(msg: string | object, args?: any[]) {
        let data = formatter(typeof msg === 'object' ? JSON.stringify(msg) : msg, ...args ?? []);
        console.warn(`${output.colors.RESET}[${output.colors.YELLOW} WARN ${output.colors.RESET}] ${data}${output.colors.RESET}`);
        logger('stdwarn', data);
    }

    export function err(msg: string | object, args?: any[]) {
        let data = formatter(typeof msg === 'object' ? JSON.stringify(msg) : msg, ...args ?? []);
        console.error(`${output.colors.RESET}[${output.colors.RED} ERR ${output.colors.RESET}] ${data}${output.colors.RESET}`);
        logger('stderr', data);
    }

    export function log(msg: string | object, args?: any[]) {
        let data = formatter(typeof msg === 'object' ? JSON.stringify(msg) : msg, ...args ?? []);
        console.error(`${output.colors.RESET}[${output.colors.CYAN} LOG ${output.colors.RESET}] ${data}${output.colors.RESET}`);
        logger('stdout', data);
    }
}

/** ft - formatting */
export const ft = output.colors;