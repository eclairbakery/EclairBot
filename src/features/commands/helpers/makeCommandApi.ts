import * as dsc from 'discord.js';
import * as log from '@/util/log.ts';

import User from '@/bot/apis/db/user.ts';

import { Command, CommandAPI, CommandArgType } from '@/bot/command.ts';
import { parseArgs, ParsedRawArgument } from './argumentParser.ts';
import { t } from '@/bot/apis/translations/translate.ts';
import { deepMerge } from '@/util/objects/objects.ts';
import { cfg } from '@/bot/cfg.ts';
import { findCmdConfResolvable } from '@/util/cmd/findCmdConfigObj.ts';
import { commands } from '@/cmd/list.ts';
import { EconomyExecutor } from '@/bot/apis/economy/action.ts';
import { flatTypesToUnion } from './flat-types.ts';

type FirstArg<T> = T extends { (...args: infer A): unknown } ? A extends [infer F, ...unknown[]] ? F : never
    : T extends { call(this: unknown, ...args: infer A): unknown } ? A extends [unknown, infer F, ...unknown[]] ? F : never
    : T extends { apply(this: unknown, args: infer A): unknown } ? A extends [infer Arr] ? Arr extends [infer F, ...unknown[]] ? F : never
        : never
    : T extends abstract new (...args: infer A) => unknown ? A extends [infer F, ...unknown[]] ? F : never
    : never;

type ContentReply<T> = T & { content: string };

function makeOptions(options: FirstArg<CommandAPI['reply']>): object {
    let result: dsc.MessageReplyOptions;

    switch (typeof options) {
        case 'string':
            result = { content: t(options) };
            break;

        case 'object': {
            const opts = options as ContentReply<typeof options>;
            // deno-lint-ignore no-explicit-any
            result = (opts.content ? deepMerge(opts, { content: t(opts.content) }) : opts) as any;
            break;
        }

        default:
            result = options;
    }

    return result;
}

export async function makeCommandApi(commandObj: Command, argsRaw: ParsedRawArgument[], context: { msg?: dsc.Message; guild?: dsc.Guild; interaction?: dsc.CommandInteraction; cmd?: Command; invokedviaalias: string }): Promise<CommandAPI> {
    const parsedArgs = await parseArgs(argsRaw, commandObj.expectedArgs, { ...context, commands });
    const rawMember = context.msg?.member ??
        (context.interaction?.member as dsc.GuildMember) ??
        null;

    const user = new User(((context.interaction?.member as dsc.GuildMember) ?? context.msg?.member)!.id);

    const api: CommandAPI = {
        // -- args --
        getEnumArg: <const O extends readonly string[]>(name: string, options: O) => {
            return api.getTypedArg(name, { base: 'enum', options });
        },
        getTypedArg: (name: string, type: CommandArgType) => {
            const types = flatTypesToUnion(Array.isArray(type) ? { base: 'union', variants: type.map((t) => ({ base: t })) } : (typeof type == 'string' ? { base: type } : type));
            // deno-lint-ignore no-explicit-any
            return parsedArgs.find((a) => a.name == name && types.some((t) => t.base == a.type.base))! as any;
        },

        // -- invoker --
        invoker: {
            user: (context.interaction?.user ?? context.msg?.author)!,
            member: rawMember,
            id: (context.interaction?.user.id ?? context.msg?.author.id)!,
        },

        // economy
        economy: new EconomyExecutor({ user: user, member: rawMember ?? undefined }),

        // misc
        reply: context.interaction ? ((options) => context.interaction!.editReply(makeOptions(options))) : ((options) => context.msg!.reply(makeOptions(options))),
        commands: commands,
        log,
        executor: user,
        channel: context.interaction?.channel ?? context.msg!.channel,
        guild: context.interaction?.guild ?? context.msg?.guild ?? undefined,

        checkCooldown: async (field, cooldownMs: number) => {
            const config = findCmdConfResolvable(commandObj.name);

            if (config.cooldownBypassUsers?.includes(user.id)) return { can: true };
            if (rawMember && config.cooldownBypassRoles) {
                if (rawMember.roles.cache.some((r) => config.cooldownBypassRoles!.includes(r.id))) {
                    return { can: true };
                }
            }

            return await user.cooldowns.check(field as 'work', cooldownMs);
        },

        raw: {
            msg: context.msg,
            interaction: context.interaction,
        },

        preferShortenedEmbeds: cfg.commands.blocking.preferShortenedEmbeds.includes((context.interaction?.channel ?? context.msg!.channel!).id),
        invokedViaAlias: context.invokedviaalias,
    };

    return api;
}
