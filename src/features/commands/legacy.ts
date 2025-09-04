import ban from "../../bot/apis/bans.js";
import kick from "../../bot/apis/kicks.js";
import mute from "../../bot/apis/muting.js";
import warn from "../../bot/apis/warns.js";
import { cfg } from "../../bot/cfg.js";
import { NextGenerationCommandAPI } from "../../bot/command.js";
import { client } from "../../client.js";
import { newGenCommands } from "../../cmd/list.js";
import { canExecuteNewCmd } from "../../util/canExecuteCmd.js";
import { findNewCommand } from "../../util/findCommand.js";
import * as log from '../../util/log.js';
import { parseArgs } from "./helpers.js";
import * as dsc from 'discord.js';

client.on('messageCreate', async (msg) => {
    if (!(msg instanceof dsc.Message)) return;
    if (!msg.content.startsWith(cfg.general.prefix)) return;

    const argsRaw = msg.content.slice(cfg.general.prefix.length).trim().split(/\s+/);
    const cmdName = argsRaw.shift()?.toLowerCase() ?? '';

    if (cfg.general.blockedChannels.includes(msg.channelId) &&
        !cfg.general.commandsExcludedFromBlockedChannels.includes(cmdName)) {
        await msg.react('❌');
        return;
    }

    const commandObj = findNewCommand(cmdName, newGenCommands)?.command;
    if (!commandObj) {
        return log.replyError(msg, 'Nie znam takiej komendy', `Komenda \`${cmdName}\` nie istnieje`);
    }

    if (!canExecuteNewCmd(commandObj, msg.member!)) {
        log.replyError(
            msg,
            'Hej, a co ty odpie*dalasz?',
            'Wiesz że nie masz uprawnień? Poczekaj aż hubix się tobą zajmie...'
        );
        return;
    }
    
    if (!msg.inGuild() && !cfg.general.worksInDM.includes(cmdName)) {
        log.replyError(
            msg,
            'Ta komenda nie jest przeznaczona do tego trybu gadania!',
            `Taka komenda jak \`${cmdName.replace('`', '')}\` może być wykonana tylko na serwerach no sorki no!`
        );
        return;
    }

    try {
        const parsedArgs = await parseArgs(argsRaw, commandObj.args);
        const api: NextGenerationCommandAPI = {
            args: parsedArgs,
            getArg: (name) => parsedArgs.find(a => a.name === name)!,
            getTypedArg: (name, type) => {const x = parsedArgs.find(a => a.name === name && a.type === type)!; console.log(x); return x;},
            msg: {
                content: msg.content,
                author: { id: msg.author.id, plainUser: msg.author },
                member: msg.member
                    ? { 
                        id: msg.member.id, 
                        moderation: {
                            warn(data) {
                                warn(msg.member, data);
                            },
                            mute(data) {
                                mute(msg.member, data);
                            },
                            kick(data) {
                                kick(msg.member, data);
                            },
                            ban(data) {
                                ban(msg.member, data);
                            },
                        }, 
                        plainMember: msg.member 
                      }
                    : ({} as any),
                reply: (options) => msg.reply(options as any),
                mentions: msg.mentions,
                guild: msg.guild,
                channel: msg.channel
            },
            plainMessage: msg,
            commands: newGenCommands
        };

        await commandObj.execute(api);

    } catch (err: any) {
        log.replyError(msg, 'Błąd w argumentach', err.message);
    }
});

export function init() {
    console.log('Legacy commands registered');
}