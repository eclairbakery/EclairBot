import {output as debug} from '@/bot/logging.js';

import { Interaction } from "discord.js";
import * as dsc from 'discord.js';
import * as log from '@/util/log.js';
import { cfg } from "@/bot/cfg.js";
import { CommandAPI, CommandFlags } from "@/bot/command.js";
import { client } from "../../client.js";
import { commands } from "../../cmd/list.js";
import findCommand from "@/util/cmd/findCommand.js";
import { parseArgs } from "./helpers/argumentParser.js";
import canExecuteCmd from "@/util/cmd/canExecuteCmd.js";
import isCommandBlockedOnChannel from "@/util/cmd/isCommandBlockedOnChannel.js";
import { findCmdConfResolvable } from '@/util/cmd/findCmdConfigObj.js';
import User from '@/bot/apis/db/user.js';
import { handleError } from './helpers/errorHandler.js';
import { makeCommandApi } from './helpers/makeCommandApi.js';
import { makeSlashCommandDesc, makeSlashCommandOptionDesc } from './helpers/makeSlashCommandDescs.js';

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
        const argsRaw = cmdObj.expectedArgs.map(arg => int.options.getString(arg.name) ?? '');
        await cmdObj.execute(await makeCommandApi(cmdObj, argsRaw, {interaction: int, cmd: cmdObj, guild: int.guild ?? undefined, invokedviaalias: int.commandName}));

    } catch (err) {
        handleError(err, { reply: (options: any) => int.editReply(options as any), });
    }
});

export async function init() {
    const commandsArray: dsc.RESTPostAPIApplicationCommandsJSONBody[] = [];
    const rest = new dsc.REST({ version: "10" }).setToken(process.env.TOKEN!);

    for (const [, cmds] of commands) {
        for (const cmd of cmds) {
            const scb = new dsc.SlashCommandBuilder()
                .setName(cmd.name)
                .setDescription(makeSlashCommandDesc(cmd));

            for (const arg of cmd.expectedArgs) {
                switch (arg.type) {
                    case 'trailing-string':
                    case 'string':
                        scb.addStringOption(option =>
                            option
                                .setName(arg.name)
                                .setDescription(makeSlashCommandOptionDesc(arg, 'Podaj wartość'))
                                .setRequired(!arg.optional)
                        );
                        break;

                    case 'number':
                        scb.addNumberOption(option =>
                            option
                                .setName(arg.name)
                                .setDescription(makeSlashCommandOptionDesc(arg, 'Podaj liczbę'))
                                .setRequired(!arg.optional)
                        );
                        break;

                    case 'user-mention-or-reference-msg-author':
                    case 'user-mention':
                        scb.addStringOption(option =>
                            option
                                .setName(arg.name)
                                .setDescription(makeSlashCommandOptionDesc(arg, 'Wskaż użytkownika'))
                                .setRequired(!arg.optional)
                        );
                        break;

                    case 'role-mention':
                        scb.addRoleOption(option =>
                            option
                                .setName(arg.name)
                                .setDescription(makeSlashCommandOptionDesc(arg, 'Wskaż rolę'))
                                .setRequired(!arg.optional)
                        );
                        break;

                    case 'channel-mention':
                        scb.addChannelOption(option =>
                            option
                                .setName(arg.name)
                                .setDescription(makeSlashCommandOptionDesc(arg, 'Wskaż kanał'))
                                .setRequired(!arg.optional)
                        );
                        break;

                    case 'timestamp':
                        scb.addStringOption(option =>
                            option
                                .setName(arg.name)
                                .setDescription(makeSlashCommandOptionDesc(arg, 'Podaj czas (timestamp)'))
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
