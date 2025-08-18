import { Command, Category } from "../bot/command.js";

export default function findCommand(cmdName: string, cmdsMap: Map<Category, Command[]>): { command: Command, category: Category } | null {
    for (const [cat, cmds] of cmdsMap.entries()) {
        for (const cmd of cmds) {
            if (cmd.name == cmdName || cmd.aliases.includes(cmdName)) {
                return { command: cmd, category: cat };
            }
        }
    }
    return null;
}