import { Command, CommandAPI } from "@/bot/command.js";
import { parseArgs } from "./argumentParser.js";
import * as dsc from 'discord.js';
import mute from "@/bot/apis/mod/muting.js";
import warn from "@/bot/apis/mod/warns.js";
import kick from "@/bot/apis/mod/kicks.js";
import ban from "@/bot/apis/mod/bans.js";
import { commands } from "@/cmd/list.js";
import * as log from '@/util/log.js';
import User from "@/bot/apis/db/user.js";

export async function makeCommandApi(commandObj: Command, argsRaw: string[], context: { msg?: dsc.Message; guild?: dsc.Guild; interaction?: dsc.CommandInteraction; cmd?: Command }): Promise<CommandAPI> {
    const parsedArgs = await parseArgs(argsRaw, commandObj.expectedArgs, context);
    const rawMember =
        context.msg?.member ??
        (context.interaction?.member as dsc.GuildMember) ??
        null;

    return {
        // -- args --
        args: parsedArgs,
        getArg: (name) => parsedArgs.find(a => a.name === name)!,
        getTypedArg: (name, type) => parsedArgs.find(a => a.name === name && a.type === type)! as any,

        // -- command message api --
        msg: {
            content: context.interaction?.commandName ?? context.msg?.content ?? 'who knows',
            author: {
                id: (context.interaction?.user.id ?? context.msg?.author.id)!,
                plainUser: (context.interaction?.user ?? context.msg?.author)!
            },
            reply: context.interaction ? ((options) => context.interaction!.editReply(options as any)) : ((options) => context.msg!.reply(options as any)),
            channel: context.interaction?.channel ?? context.msg!.channel,
            member: rawMember ? 
            {
                id: rawMember!.id,
                moderation: {
                    warn(data) {
                        return warn(rawMember!, data);
                    },
                    mute(data) {
                        return mute(rawMember!, data);
                    },
                    kick(data) {
                        return kick(rawMember!, data);
                    },
                    ban(data) {
                        return ban(rawMember!, data);
                    },
                },
                plainMember: rawMember!
            }
            : undefined,
            guild: context.interaction?.guild ?? context.msg?.guild ?? undefined
        },

        // misc
        reply: context.interaction ? ((options) => context.interaction!.editReply(options as any)) : ((options) => context.msg!.reply(options as any)),
        commands: commands,
        log,
        executor: new User(((context.interaction?.member as dsc.GuildMember) ?? context.msg?.member)!.id),
        channel: context.interaction?.channel ?? context.msg!.channel,
    };
}