import * as log from '@/util/log.js';
import * as dsc from 'discord.js';
import {output as debug} from '@/bot/logging.js';

import ban from "@/bot/apis/mod/bans.js";
import kick from "@/bot/apis/mod/kicks.js";
import mute from "@/bot/apis/mod/muting.js";
import warn from "@/bot/apis/mod/warns.js";

import { cfg } from "@/bot/cfg.js";
import { CommandAPI, CommandMessageAPI } from "@/bot/command.js";
import { client } from "@/client.js";
import { commands } from "@/cmd/list.js";

import canExecuteCmd from "@/util/canExecuteCmd.js";
import findCommand from "@/util/findCommand.js";

import { parseArgs, handleError } from "./helpers.js";
import isCommandBlockedOnChannel from '@/util/isCommandBlockedOnChannel.js';
import { findCmdConfResolvable } from '@/util/findCmdConfigObj.js';

client.on('messageCreate', async (msg) => {
    if (!(msg instanceof dsc.Message)) return;
    if (!msg.content.toLowerCase().startsWith(cfg.general.prefix.toLowerCase())) return;

    const argsRaw = msg.content.slice(cfg.general.prefix.length).trim().split(/\s+/);
    const cmdName = argsRaw.shift()?.toLowerCase() ?? '';

    const commandObj = findCommand(cmdName, commands)?.command;
    if (!commandObj) {
        return log.replyError(msg, cfg.customization.commandsErrors.legacy.commandNotFoundHeader, cfg.customization.commandsErrors.legacy.commandNotFoundText.replace('<cmd>', cmdName.replaceAll('`', '')));
    }


    if (!canExecuteCmd(commandObj, msg.member!)) {
        log.replyError(
            msg,
            cfg.customization.commandsErrors.legacy.missingPermissionsHeader,
            cfg.customization.commandsErrors.legacy.missingPermissionsText
        );
        return;
    }

    const isBlocked = isCommandBlockedOnChannel(commandObj, msg.channelId);
    if (isBlocked) {
        await msg.react('❌');
        return;
    }

    if (!msg.inGuild() && (commandObj.permissions.worksInDM ?? false)) {
        log.replyError(
            msg,
            cfg.customization.commandsErrors.legacy.doesNotWorkInDmHeader,
            cfg.customization.commandsErrors.legacy.doesNotWorkInDmText.replace('<cmd>', cmdName.replaceAll('`', ''))
        );
        return;
    }

    if (!findCmdConfResolvable(commandObj.name).enabled) {
        log.replyWarn(
            msg,
            cfg.customization.commandsErrors.legacy.commandDisabledHeader,
            cfg.customization.commandsErrors.legacy.commandDisabledDescription
        );
        return;
    }

    try {
        const parsedArgs = await parseArgs(argsRaw, commandObj.expectedArgs, { msg: msg, guild: msg.guild ?? undefined, cmd: commandObj });
        const api: CommandAPI = {
            args: parsedArgs,
            getArg(name) {
                return parsedArgs.find(a => a.name == name)!;
            },
            getTypedArg(name, type) {
                return parsedArgs.find(a => a.name == name && a.type == type)!;
            },
            msg: {
                content: msg.content,
                author: { id: msg.author.id, plainUser: msg.author },
                member: msg.member
                    ? {
                        id: msg.member!.id,
                        moderation: {
                            warn(data) {
                                return warn(msg.member!, data);
                            },
                            mute(data) {
                                return mute(msg.member!, data);
                            },
                            kick(data) {
                                return kick(msg.member!, data);
                            },
                            ban(data) {
                                return ban(msg.member!, data);
                            },
                        },
                        plainMember: msg.member
                      }
                    : undefined,
                reply: (options) => msg.reply(options as any),
                mentions: (msg.mentions as any ?? { members: new dsc.Collection(), channels: new dsc.Collection(), roles: new dsc.Collection(), users: new dsc.Collection() }) satisfies CommandMessageAPI['mentions'],
                guild: msg.guild != null ? msg.guild : undefined,
                channel: msg.channel
            },
            plainMessage: msg,
            commands: commands
        };

        await commandObj.execute(api);
    } catch (err) {
        handleError(err, msg);
    }
});

export function init() {
    debug.log('Legacy commands event registered');
}
