import { Category, Command } from '@/bot/command.ts';
import { output } from '@/bot/logging.ts';
import logError from '@/util/logError.ts';

export const commands: Map<Category, Command[]> = new Map();

export async function registerCommands() {
    for (const cat of Deno.readDirSync("./src/cmd")) {
        if (cat.isFile) continue;

        const category = Category.fromString(cat.name);
        if (!category) {
            output.warn(`Skiiping unknown category: ${cat.name}`);
            continue;
        }

        const cat_cmds: Command[] = [];

        for (const cmd of Deno.readDirSync(`./src/cmd/${cat.name}`)) {
            if (!cmd.name.endsWith(".ts")) {
                output.warn("Invalid file (wrong file extension) inside commands directory: " + cmd.name);
                continue;
            }

            try {
                const module = await import(`@/cmd/${cat.name}/${cmd.name}`);

                if (!module.default) {
                    output.warn('No default export found in command ' + cmd.name);
                    continue;
                }

                cat_cmds.push(module.default);
            } catch (e) {
                logError('stdwarn', e, "Command importer");
            }
        }

        commands.set(
            Category.fromString(cat.name)!,
            cat_cmds
        );
    }
}
