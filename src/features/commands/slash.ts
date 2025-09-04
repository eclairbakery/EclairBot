import { Interaction } from "discord.js";
import { cfg } from "../../bot/cfg.js";
import { NextGenerationCommandAPI } from "../../bot/command.js";
import { client } from "../../client.js";
import { newGenCommands } from "../../cmd/list.js";
import { findNewCommand } from "../../util/findCommand.js";
import { parseArgs } from "./helpers.js";
import { canExecuteNewCmd } from "../../util/canExecuteCmd.js";

client.on('interactionCreate', async (int: Interaction) => {
    if (!int.isChatInputCommand()) return;
    await int.deferReply({ ephemeral: true });

    const cmdObj = findNewCommand(int.commandName, newGenCommands)?.command;
    if (!cmdObj) return int.editReply({ content: 'Nie znam takiej komendy' });

    if (!int.guild && !cfg.general.worksInDM.includes(int.commandName)) {
        int.reply('Niektóre komendy są tak jakby safe tylko na serwerze więc... możesz mieć problem jak tu odpalisz. Dlatego ci nie pozwalam.');
        return;
    }

    if (!canExecuteNewCmd(cmdObj, int.member! as any)) {
        int.reply('Nie można tak!');
        return;
    }

    try {
        const argsRaw = cmdObj.args.map(arg => int.options.getString(arg.name) ?? undefined);
        const parsedArgs = await parseArgs(argsRaw as string[], cmdObj.args);

        const api: NextGenerationCommandAPI = {
            args: parsedArgs,
            getArg: (name) => parsedArgs.find(a => a.name === name)!,
            getTypedArg: (name, type) => parsedArgs.find(a => a.name === name && a.type === type)!,
            msg: {
                content: int.commandName,
                author: { id: int.user.id, plainUser: int.user },
                member: int.member as any,
                reply: (options) => int.editReply(options as any),
                mentions: int.options.data as any,
                guild: int.guild!,
                channel: int.channel!
            },
            plainInteraction: int,
            commands: newGenCommands
        };

        await cmdObj.execute(api);

    } catch (err: any) {
        await int.editReply({ content: `Błąd:\n\`\`\`${err.message}\`\`\`` });
    }
});

export function init() {
    console.log('Slash commands registered');
}