import { Interaction } from "discord.js";
import { cfg } from "@/bot/cfg.js";
import { CommandAPI } from "@/bot/command.js";
import { client } from "../../client.js";
import { commands } from "../../cmd/list.js";
import findCommand from "@/util/findCommand.js";
import { handleError, parseArgs } from "./helpers.js";
import canExecuteCmd from "@/util/canExecuteCmd.js";
import isCommandBlockedOnChannel from "@/util/isCommandBlockedOnChannel.js";

client.on('interactionCreate', async (int: Interaction) => {
    if (!int.isChatInputCommand()) return;

    const cmdObj = findCommand(int.commandName, commands)?.command;
    if (!cmdObj) return int.reply({ content: 'Nie znam takiej komendy' });

    if (!int.guild && (cmdObj.permissions.worksInDM ?? false)) {
        int.reply('Niektóre komendy są tak jakby safe tylko na serwerze więc... możesz mieć problem jak tu odpalisz. Dlatego ci nie pozwalam.');
        return;
    }

    if (!canExecuteCmd(cmdObj, int.member! as any)) {
        int.reply('Nie można tak!');
        return;
    }

    const isBlocked = isCommandBlockedOnChannel(cmdObj, int.channelId);
    await int.deferReply({
        ephemeral: isBlocked
    });

    try {
        const argsRaw = cmdObj.expectedArgs.map(arg => int.options.getString(arg.name) ?? undefined);
        const parsedArgs = await parseArgs(argsRaw as string[], cmdObj.expectedArgs, { interaction: int });

        const api: CommandAPI = {
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
            commands: commands
        };

        await cmdObj.execute(api);

    } catch (err) {
        handleError(err, { reply: (options) => int.editReply(options as any), });
    }
});

export function init() {
    console.log('Slash commands registered');
}
