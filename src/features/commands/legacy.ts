import ban from "@/bot/apis/mod/bans.js";
import kick from "@/bot/apis/mod/kicks.js";
import mute from "@/bot/apis/mod/muting.js";
import warn from "@/bot/apis/mod/warns.js";
import { cfg } from "@/bot/cfg.js";
import { CommandAPI } from "@/bot/command.js";
import { client } from "@/client.js";
import { commands } from "@/cmd/list.js";
import canExecuteCmd from "@/util/canExecuteCmd.js";
import findCommand from "@/util/findCommand.js";
import * as log from '@/util/log.js';
import { parseArgs } from "./helpers.js";
import * as dsc from 'discord.js';

client.on('messageCreate', async (msg) => {
    if (!(msg instanceof dsc.Message)) return;
    if (!msg.content.toLowerCase().startsWith(cfg.general.prefix.toLowerCase())) return;

    const argsRaw = msg.content.slice(cfg.general.prefix.length).trim().split(/\s+/);
    const cmdName = argsRaw.shift()?.toLowerCase() ?? '';

    if (cfg.general.blockedChannels.includes(msg.channelId) &&
        !cfg.general.commandsExcludedFromBlockedChannels.includes(cmdName)) {
        await msg.react('❌');
        return;
    }

    const commandObj = findCommand(cmdName, commands)?.command;
    if (!commandObj) {
        return log.replyError(msg, 'Nie znam takiej komendy', `Komenda \`${cmdName}\` nie istnieje`);
    }

    if (!canExecuteCmd(commandObj, msg.member!)) {
        log.replyError(
            msg,
            'Hej, a co ty odpie*dalasz?',
            'Wiesz że nie masz uprawnień? Poczekaj aż hubix się tobą zajmie...'
        );
        return;
    }

    // if (!msg.inGuild() && !cfg.general.worksInDM.includes(cmdName)) {
    //     log.replyError(
    //         msg,
    //         'Ta komenda nie jest przeznaczona do tego trybu gadania!',
    //         `Taka komenda jak \`${cmdName.replace('`', '')}\` może być wykonana tylko na serwerach no sorki no!`
    //     );
    //     return;
    // }

    try {
        const parsedArgs = await parseArgs(argsRaw, commandObj.expectedArgs, { msg: msg, guild: msg.guild });
        const api: CommandAPI = {
            args: parsedArgs,
            getArg(name) {
                return parsedArgs.find(a => a.name == name)!
            },
            getTypedArg(name, type) {
                const x = parsedArgs.find(a => a.name == name && a.type == type)!;
                // console.log(`Getting typed arg ${name} of type ${type}:`, x);
                return x;
            },
            msg: {
                content: msg.content,
                author: { id: msg.author.id, plainUser: msg.author },
                member: msg.member
                    ? {
                        id: msg.member.id,
                        moderation: {
                            warn(data) {
                                return warn(msg.member, data);
                            },
                            mute(data) {
                                return mute(msg.member, data);
                            },
                            kick(data) {
                                return kick(msg.member, data);
                            },
                            ban(data) {
                                return ban(msg.member, data);
                            },
                        },
                        plainMember: msg.member
                      }
                    : undefined,
                reply: (options) => msg.reply(options as any),
                mentions: msg.mentions,
                guild: msg.guild != null ? msg.guild : undefined,
                channel: msg.channel
            },
            plainMessage: msg,
            commands: commands
        };

        await commandObj.execute(api);
    } catch (err) {
        log.replyError(msg, 'Błąd w argumentach', err.message);
        throw err;
    }
});

export function init() {
    console.log('Legacy commands registered');
}
