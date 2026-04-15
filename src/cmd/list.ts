import { Category, Command } from '@/bot/command.ts';
import { output } from '@/bot/logging.ts';
import logError from '@/util/logError.ts';
import { findCmdConfResolvable } from '@/util/cmd/findCmdConfigObj.ts';
import { CommandPermissions } from '@/bot/apis/commands/permissions.ts';
import { deepEqual } from '@/util/objects/objects.ts';

export const commands: Map<Category, Command[]> = new Map();

export async function registerCommands() {
    for (const cat of Deno.readDirSync("./src/cmd")) {
        if (cat.isFile) continue;

        const category = Category.fromString(cat.name);
        if (!category) {
            output.warn(`Skipping unknown category: ${cat.name}`);
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

                const command: Command = module.default;
                const cmd_cfg = findCmdConfResolvable(cmd.name);

                if (cmd_cfg.enabled) {
                    if (deepEqual(command.permissions, CommandPermissions.devOnly()) || command.name == 'configuration')
                        output.warn("Dev-only command " + command.name + " should not be disabled. Leaving enabled.");
                    else 
                        continue;
                }

                cat_cmds.push(command);
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
