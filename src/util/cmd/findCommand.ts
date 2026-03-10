import { Category, Command } from "@/bot/command.js";
import { AnyCommandConfig } from "@/bot/definitions/config-subtypes.js";
import { findCmdConfigObjOrDefault } from "./findCmdConfigObj.js";

export type FindResult = { command: Command, category: Category, config: AnyCommandConfig };

export default function findCommand(cmdName: string, cmdsMap: Map<Category, Command[]>): FindResult | null {
    for (const [cat, cmds] of cmdsMap.entries()) {
        for (const cmd of cmds) {
            if (cmd.name == cmdName || cmd.aliases.includes(cmdName)) {
                const cfg = findCmdConfigObjOrDefault(cmd);
                return { command: cmd, category: cat, config: cfg };
            }
        }
    }
    return null;
}
