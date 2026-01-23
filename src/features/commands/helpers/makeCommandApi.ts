import { Command, CommandAPI, CommandMessageAPI } from "@/bot/command.js";
import { parseArgs } from "./argumentParser.js";
import * as dsc from 'discord.js';
import mute from "@/bot/apis/mod/muting.js";
import warn from "@/bot/apis/mod/warns.js";
import kick from "@/bot/apis/mod/kicks.js";
import ban from "@/bot/apis/mod/bans.js";
import { commands } from "@/cmd/list.js";
import * as log from '@/util/log.js';
import User from "@/bot/apis/db/user.js";
import { ReplyEmbed } from "@/bot/apis/translations/reply-embed.js";
import { t } from "@/bot/apis/translations/translate.js";
import { deepMerge } from "@/util/objects/objects.js";
import { cfg } from "@/bot/cfg.js";

type FirstArg<T> =
    T extends { (...args: infer A): any } ?
        A extends [infer F, ...any[]] ? F : never :
    T extends { call(this: any, ...args: infer A): any } ?
        A extends [any, infer F, ...any[]] ? F : never :
    T extends { apply(this: any, args: infer A): any } ?
        A extends [infer Arr] ?
            Arr extends [infer F, ...any[]] ? F : never
        : never :
    T extends abstract new (...args: infer A) => any ?
        A extends [infer F, ...any[]] ? F : never :
    never;

type ContentReply<T> = T & {content: string;};

function stringifyEmbed(embed: dsc.APIEmbed): string {
    let out: string[] = [];

    if (embed.title) out.push(`**${embed.title}**`);
    if (embed.description) out.push(embed.description);

    if (embed.fields?.length) {
        for (const field of embed.fields) {
            out.push(`\n**${field.name}**\n${field.value}`);
        }
    }

    return out.join('\n');
}

function makeOptions(options: FirstArg<CommandMessageAPI['reply']>): any {
    let result: any;

    switch (typeof options) {
        case "string":
            result = { content: t(options) };
            break;

        case "object":
            let opts = options as ContentReply<typeof options>;
            result = opts.content
                ? deepMerge(opts, { content: t(opts.content) })
                : opts;
            break;

        default:
            result = options;
    }

    if (cfg.customization.stringifyEmbed && result?.embeds?.length) {
        const embedText = result.embeds
            .map((e: any) => {
                if (typeof e?.toJSON === 'function') {
                    return stringifyEmbed(e.toJSON());
                }
                return stringifyEmbed(e);
            })
            .join('\n\n');

        result.content = result.content
            ? `${result.content}\n\n${embedText}`
            : embedText;

        delete result.embeds;
    }

    return result;
}

export async function makeCommandApi(commandObj: Command, argsRaw: string[], context: { msg?: dsc.Message; guild?: dsc.Guild; interaction?: dsc.CommandInteraction; cmd?: Command }): Promise<CommandAPI> {
    const parsedArgs = await parseArgs(argsRaw, commandObj.expectedArgs, context);
    const rawMember =
        context.msg?.member ??
        (context.interaction?.member as dsc.GuildMember) ??
        null;

    return {
        // -- args --
        args: parsedArgs,
        getTypedArg: (name, type) => parsedArgs.find(a => a.name === name && a.type === type)! as any,

        // -- command message api --
        msg: {
            content: context.interaction?.commandName ?? context.msg?.content ?? 'who knows',
            author: {
                id: (context.interaction?.user.id ?? context.msg?.author.id)!,
                plainUser: (context.interaction?.user ?? context.msg?.author)!
            },
            reply: context.interaction ? ((options) => context.interaction!.editReply(makeOptions(options))) : ((options) => context.msg!.reply(makeOptions(options) as any)),
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
        reply: context.interaction ? ((options) => context.interaction!.editReply(makeOptions(options))) : ((options) => context.msg!.reply(makeOptions(options))),
        commands: commands,
        log,
        executor: new User(((context.interaction?.member as dsc.GuildMember) ?? context.msg?.member)!.id),
        channel: context.interaction?.channel ?? context.msg!.channel,
        guild: context.interaction?.guild ?? context.msg?.guild ?? undefined
    };
}