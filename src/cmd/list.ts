import { Category, Command } from '@/bot/command.ts';
import { join } from 'node:path';
import { output } from '@/bot/logging.ts';

export const commands: Map<Category, Command[]> = new Map();

export async function registerCommands() {
    for (const cat of Deno.readDirSync(join(".", "src", "cmd"))) {
        if (cat.isFile) continue;

        const cat_cmds: Command[] = [];

        for (const cmd of Deno.readDirSync(join(".", "src", "cmd", cat.name))) {
            if (!cmd.name.endsWith(".ts")) {
                output.warn("Invalid file (wrong file extension) inside commands directory: " + cmd.name);
                continue;
            }

            const module = await import(
                '@/' + 
                join("cmd", cat.name, cmd.name)
            );

            if (!module.default) {
                output.warn('No default export found in command ' + cmd.name);
                continue;
            }

            cat_cmds.push(module.default);
        }

        commands.set(
            Category.fromString(cat.name)!,
            cat_cmds
        );
    }
}
