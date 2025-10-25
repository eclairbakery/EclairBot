import {output as debug} from '@/bot/logging.js';

import { Interaction } from "discord.js";
import { cfg } from "@/bot/cfg.js";
import { CommandAPI } from "@/bot/command.js";
import { client } from "../../client.js";
import { commands } from "../../cmd/list.js";
import findCommand from "@/util/findCommand.js";
import { handleError, parseArgs } from "./helpers.js";
import canExecuteCmd from "@/util/canExecuteCmd.js";
import isCommandBlockedOnChannel from "@/util/isCommandBlockedOnChannel.js";
import { findCmdConfResolvable } from '@/util/findCmdConfigObj.js';

client.on('interactionCreate', async (int: Interaction) => {
    if (!int.isChatInputCommand()) return;

    const cmdObj = findCommand(int.commandName, commands)?.command;
    if (!cmdObj) return int.reply({ content: 'Nie znam takiej komendy' });

    if (!int.guild && (cmdObj.permissions.worksInDM ?? false)) {
        int.reply('Nie możesz tej komendy uruchomić w DMach.');
        return;
    }

    if (!canExecuteCmd(cmdObj, int.member! as any)) {
        int.reply('Nie masz uprawnień.');
        return;
    } 

    if (!findCmdConfResolvable(cmdObj.name).enabled) {
        int.reply('Ktoś tą komendę z jakiegoś powodu wyłączył...');
        return;
    }

    const isBlocked = isCommandBlockedOnChannel(cmdObj, int.channelId);
    await int.deferReply({
        ephemeral: isBlocked || cmdObj.slashCmdFlags?.ephemeral == true
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
    debug.log('Slash commands event registered');
}
