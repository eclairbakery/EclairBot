import * as log from '@/util/log.js';
import * as dsc from 'discord.js';
import {output as debug} from '@/bot/logging.js';

import ban from "@/bot/apis/mod/bans.js";
import kick from "@/bot/apis/mod/kicks.js";
import mute from "@/bot/apis/mod/muting.js";
import warn from "@/bot/apis/mod/warns.js";

import { cfg } from "@/bot/cfg.js";
import { CommandAPI, CommandFlags, CommandMessageAPI } from "@/bot/command.js";
import { client } from "@/client.js";
import { commands } from "@/cmd/list.js";

import canExecuteCmd from "@/util/cmd/canExecuteCmd.js";
import findCommand from "@/util/cmd/findCommand.js";

import { parseArgs, handleError } from "./helpers.js";
import isCommandBlockedOnChannel from '@/util/cmd/isCommandBlockedOnChannel.js';
import { findCmdConfResolvable } from '@/util/cmd/findCmdConfigObj.js';
import actionsManager, { PredefinedActionEventTypes } from '../actions/index.js';
import { PredefinedColors } from '@/util/color.js';
import User from '@/bot/apis/db/user.js';

function waitForButton(interaction: dsc.Message, buttonId: string, time = 15000) {
    return new Promise((resolve, reject) => {
        const collector = interaction.channel.createMessageComponentCollector({
            filter: function (i) {return i.customId === buttonId && i.user.id === interaction.author.id},
            time
        });

        collector.on('collect', async i => {
            await i.deferUpdate(); 
            collector.stop('clicked');
            resolve(i); 
        });

        collector.on('end', (collected, reason) => {
            if (reason !== 'clicked') {
                reject(new Error('Button not clicked in time'));
            }
        });
    });
}

async function legacyCommandsMessageHandler(msg: dsc.OmitPartialGroupDMChannel<dsc.Message<boolean>>) {
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

    const isBlocked = isCommandBlockedOnChannel(commandObj, msg.channelId, !msg.inGuild());
    if (isBlocked) {
        await msg.react('❌');
        return;
    }

    if (!msg.inGuild() && !(commandObj.flags & CommandFlags.WorksInDM)) {
        log.replyError(
            msg,
            cfg.customization.commandsErrors.legacy.doesNotWorkInDmHeader,
            cfg.customization.commandsErrors.legacy.doesNotWorkInDmText.replace('<cmd>', cmdName.replaceAll('`', ''))
        );
        return;
    }

    const row = new dsc.ActionRowBuilder()
    .addComponents(
        new dsc.ButtonBuilder()
        .setCustomId('confirm')
        .setLabel('Potwierdzam')
        .setStyle(dsc.ButtonStyle.Danger)
    );

    if (commandObj.flags & CommandFlags.Unsafe) {
        const reply = await msg.reply({ embeds: [
            new dsc.EmbedBuilder()
                .setColor(PredefinedColors.Red)
                .setTitle('Potwierdź, że chcesz uruchomić tą komendę!')
                .setDescription('Została ona oznaczona jako potencjalnie niebezpieczna i może wywołać nieodwracalne skutki. Upewnij się, iż na pewno jest ona dobrze użyta i nie ma żadnych błędów w argumentach.')
        ], components: [row.toJSON()] });

        try {
            await waitForButton(msg, 'confirm', 20000);
            try {
                reply.delete();
            } catch {}
        } catch {
            return;
        }
    }

    if (!findCmdConfResolvable(commandObj.name).enabled && commandObj.name !== 'configuration') {
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
                return parsedArgs.find(a => a.name == name && a.type == type)! as any;
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
                guild: msg.guild != null ? msg.guild : undefined,
                channel: msg.channel
            },
            plainMessage: msg,
            commands: commands,
            guild: msg.guild ?? undefined,
            log,
            channel: msg.channel,
            reply: (options) => msg.reply(options as any),
            executor: new User(msg.author.id)
        };

        await commandObj.execute(api);
    } catch (err) {
        handleError(err, msg);
    }
}

export function init() {
    actionsManager.addAction({
        callbacks: [legacyCommandsMessageHandler],
        constraints: [(msg) => msg.content.toLowerCase().startsWith(cfg.general.prefix.toLowerCase())],
        activationEventType: PredefinedActionEventTypes.OnMessageCreate
    });
    debug.log('Legacy commands event registered');
}
