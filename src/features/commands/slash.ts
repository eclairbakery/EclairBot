import {output as debug} from '@/bot/logging.js';

import { Interaction } from "discord.js";
import * as dsc from 'discord.js';
import * as log from '@/util/log.js';
import { cfg } from "@/bot/cfg.js";
import { CommandAPI, CommandFlags } from "@/bot/command.js";
import { client } from "../../client.js";
import { commands } from "../../cmd/list.js";
import findCommand from "@/util/cmd/findCommand.js";
import { handleError, parseArgs } from "./helpers.js";
import canExecuteCmd from "@/util/cmd/canExecuteCmd.js";
import isCommandBlockedOnChannel from "@/util/cmd/isCommandBlockedOnChannel.js";
import { findCmdConfResolvable } from '@/util/cmd/findCmdConfigObj.js';
import User from '@/bot/apis/db/user.js';

client.on('interactionCreate', async (int: Interaction) => {
    if (!int.isChatInputCommand()) return;

    const cmdObj = findCommand(int.commandName, commands)?.command;
    if (!cmdObj) return int.reply({ content: cfg.customization.commandsErrors.slash.commandNotFound });

    if (!int.guild && !(cmdObj.flags & CommandFlags.WorksInDM)) {
        int.reply(cfg.customization.commandsErrors.slash.notAllowedInDm);
        return;
    }

    if (!canExecuteCmd(cmdObj, int.member! as any)) {
        int.reply(cfg.customization.commandsErrors.slash.missingPermissions);
        return;
    } 

    if (!findCmdConfResolvable(cmdObj.name).enabled) {
        int.reply(cfg.customization.commandsErrors.slash.commandIsDisabled);
        return;
    }

    const isBlocked = isCommandBlockedOnChannel(cmdObj, int.channelId, int.guild ? false : true);
    await int.deferReply({
        flags: (!!(isBlocked || (cmdObj.flags & CommandFlags.Ephemeral))) ? ["Ephemeral"] : []
    });

    try {
        const argsRaw = cmdObj.expectedArgs.map(arg => int.options.getString(arg.name) ?? undefined);
        const parsedArgs = await parseArgs(argsRaw as string[], cmdObj.expectedArgs, { interaction: int, cmd: cmdObj });

        const api: CommandAPI = {
            args: parsedArgs,
            getArg: (name) => parsedArgs.find(a => a.name === name)!,
            getTypedArg: (name, type) => parsedArgs.find(a => a.name === name && a.type === type)! as any,
            msg: {
                content: int.commandName,
                author: { id: int.user.id, plainUser: int.user },
                member: int.member as any,
                reply: (options) => int.editReply(options as any),
                guild: int.guild!,
                channel: int.channel!
            },
            plainInteraction: int,
            commands: commands,
            guild: int.guild ?? undefined,
            channel: int.channel!,
            log,
            reply: (options) => int.editReply(options as any),
            executor: new User(int.user.id)
        };

        await cmdObj.execute(api);

    } catch (err) {
        handleError(err, { reply: (options) => int.editReply(options as any), });
    }
});

export async function init() {
    const commandsArray: dsc.RESTPostAPIApplicationCommandsJSONBody[] = [];
    const rest = new dsc.REST({ version: "10" }).setToken(process.env.TOKEN!);

    for (const [, cmds] of commands) {
        for (const cmd of cmds) {
            const scb = new dsc.SlashCommandBuilder()
                .setName(cmd.name)
                .setDescription(
                    cmd.description.main.length > 90
                        ? (cmd.description.short.length > 90
                            ? (cmd.description.short.slice(0, 87) + '...')
                            : cmd.description.short)
                        : cmd.description.main
                );

            for (const arg of cmd.expectedArgs) {
                switch (arg.type) {
                    case 'trailing-string':
                    case 'string':
                        scb.addStringOption(option =>
                            option
                                .setName(arg.name)
                                .setDescription('Podaj wartość')
                                .setRequired(!arg.optional)
                        );
                        break;

                    case 'number':
                        scb.addNumberOption(option =>
                            option
                                .setName(arg.name)
                                .setDescription('Podaj liczbę')
                                .setRequired(!arg.optional)
                        );
                        break;

                    case 'user-mention-or-reference-msg-author':
                    case 'user-mention':
                        scb.addStringOption(option =>
                            option
                                .setName(arg.name)
                                .setDescription('Wskaż użytkownika')
                                .setRequired(!arg.optional)
                        );
                        break;

                    case 'role-mention':
                        scb.addRoleOption(option =>
                            option
                                .setName(arg.name)
                                .setDescription('Wskaż rolę')
                                .setRequired(!arg.optional)
                        );
                        break;

                    case 'channel-mention':
                        scb.addChannelOption(option =>
                            option
                                .setName(arg.name)
                                .setDescription('Wskaż kanał')
                                .setRequired(!arg.optional)
                        );
                        break;

                    case 'timestamp':
                        scb.addStringOption(option =>
                            option
                                .setName(arg.name)
                                .setDescription('Podaj timestamp')
                                .setRequired(!arg.optional)
                        );
                        break;
                }
            }

            commandsArray.push(scb.toJSON());
        }
    }

    try {
        await rest.put(
            dsc.Routes.applicationCommands(client.application!.id),
            { body: commandsArray }
        );
        debug.log('Slash commands registered');
    } catch (err) {
        debug.err('Slash commands error: ' + err);
    }
}
