import {
    CommandArgument,
    CommandValuableArgument,
    CommandArgType,
    Command,
    CommandFlags,
    Category
} from '@/bot/command.js';

import * as dsc from 'discord.js';

import parseTimestamp from '@/util/parseTimestamp.js';
import findCommand from '@/util/cmd/findCommand.js';
import User from '@/bot/apis/db/user.js';
import Money from '@/util/money.js';
import { NumberParseError } from '@/util/math/parse.js';

import { ArgMustBeSomeTypeError, MissingRequiredArgError } from '../defs/errors.js';
import { flatTypesToUnion } from './flat-types.js';

async function parseUser(raw: string, name: string, context?: ParserContext): Promise<dsc.GuildMember | null> {
    try {
        if (context?.interaction) {
            const memberStr = (context.interaction as dsc.ChatInputCommandInteraction).options.getString(name);
            if (!memberStr) return null;
            const id = memberStr.replace(/[<@!>]/g, '');
            return await context.interaction.guild!.members.fetch(id).catch(() => null);
        } else if (context?.msg) {
            const id = raw.replace(/[<@!>]/g, '');
            return await context.msg.guild!.members.fetch(id).catch(() => null);
        }
    } catch {
        return null;
    }
    return null;
}

async function tryParseUserMentionOrRef(decl: CommandArgument, context?: ParserContext): Promise<dsc.GuildMember | null> {
    if (context?.msg && context.msg.reference) {
        try {
            const refMessageId = context.msg.reference.messageId;
            const refChannelId = context.msg.reference.channelId;

            const channel = await context.msg.guild!.channels.fetch(refChannelId);
            if (channel && channel.isTextBased()) {
                const refMessage = await (channel as dsc.TextChannel).messages.fetch({ message: refMessageId ?? '', force: false });
                return await context.msg.guild!.members.fetch(refMessage.author.id).catch(() => null);
            }
        } catch {
            return null;
        }
    }

    return null;
}

export interface ParserContext {
    msg?: dsc.Message;
    guild?: dsc.Guild;
    interaction?: dsc.CommandInteraction;
    cmd?: Command;
    commands?: Map<Category, Command[]>;
}

async function tryParseArg(
    type: CommandArgType,
    raw: string,
    argIndex: number,
    rawArgs: string[],
    decl: CommandArgument,
    context?: ParserContext
): Promise<CommandValuableArgument | null> {
    if (type.base == 'union') return null;

    switch (type.base) {
    case 'string': {
        const val = type.trailing ? rawArgs.slice(argIndex).join(' ') : raw;
        return { ...decl, type, value: val } as CommandValuableArgument;
    }
    case 'enum': {
        const val = type.trailing ? rawArgs.slice(argIndex).join(' ') : raw;
        const found = type.options.find(o => o.toLowerCase() == val.toLowerCase());
        if (!found) {
            return null;
        }
        return { ...decl, type, value: found } as CommandValuableArgument;
    }

    case 'int': {
        const isInt = /^-?\d+$/.test(raw);
        if (!isInt) return null;

        return { ...decl, type, value: BigInt(raw) } as CommandValuableArgument;
    }
    case 'float': {
        const isFloat = /^-?\d+(\.\d+)?$/.test(raw);
        if (!isFloat) return null;

        return { ...decl, type, value: Number(raw) } as CommandValuableArgument;
    }

    case 'money': {
        const input = raw.trim().toLowerCase();
        const invokerId = context?.interaction?.user.id ?? context?.msg?.author.id;
        
        if (type.source && (input == 'all' || input.endsWith('%')) && invokerId) {
            const balance = await new User(invokerId).economy.getBalance();
            const sourceMoney = type.source == 'wallet' ? balance.wallet : balance.bank;

            if (input == 'all') {
                return { ...decl, type, value: sourceMoney.clone() } as CommandValuableArgument;
            }

            const percentMatch = input.match(/^(\d+(?:[.,]\d+)?)%$/);
            if (percentMatch) {
                const percent = parseFloat(percentMatch[1].replace(',', '.')) / 100;
                const amountCents = (sourceMoney.asCents() * BigInt(Math.round(percent * 10000))) / 10000n;
                return { ...decl, type, value: Money.fromCents(amountCents) } as CommandValuableArgument;
            }
        }

        try {
            const parsed = Money.parse(raw);
            return { ...decl, type, value: parsed } as CommandValuableArgument;
        } catch (e) {
            if (e instanceof NumberParseError) return null;
            throw e;
        }
    }

    case 'timestamp': {
        const ts = parseTimestamp(raw);
        if (!ts) return null;
        return { ...decl, type, value: ts } as CommandValuableArgument;
    }

    case 'user-mention': {
        const user = await parseUser(raw, decl.name, context);
        if (!user) return null;
        return { ...decl, type, value: user } as CommandValuableArgument;
    }

    case 'role-mention': {
        const match = raw.match(/^<@&(\d+)>$/);
        const roleId = match?.[1];
        let role: dsc.Role | null = null;

        if (roleId && (context?.guild || context?.msg?.guild)) {
            const guild = context?.guild ?? context?.msg?.guild!;
            role = context?.msg?.mentions.roles?.get(roleId) ?? guild.roles.cache.get(roleId) ?? null;
        }
        if (!role) return null;
        return { ...decl, type, value: role } as CommandValuableArgument;
    }

    case 'channel-mention': {
        const match = raw.match(/^<#(\d+)>$/);
        const channelID = match?.[1];
        let channel: dsc.GuildChannel | null = null;

        if (channelID && (context?.guild || context?.msg?.guild)) {
            const guild = context?.guild ?? context?.msg?.guild!;
            const foundChannel = context?.msg?.mentions.channels?.get(channelID) ?? guild.channels.cache.get(channelID);
            if (foundChannel && foundChannel instanceof dsc.GuildChannel) {
                channel = foundChannel;
            }
        }
        if (!channel) return null;
        return { ...decl, type, value: channel } as CommandValuableArgument;
    }

    case 'command-ref': {
        if (!context?.commands) return null;
        const res = findCommand(raw, context.commands);
        if (!res) return null;
        return { ...decl, type, value: res.command } as CommandValuableArgument;
    }

    default:
        return null;
    }
}

export async function parseArgs(
    rawArgs: string[],
    declaredArgs: CommandArgument[],
    context?: ParserContext
): Promise<CommandValuableArgument[]> {
    const parsedArgs: CommandValuableArgument[] = [];

    let argIndex = 0;

    for (let declIndex = 0; declIndex < declaredArgs.length; ++declIndex) {
        const decl: CommandArgument = declaredArgs[declIndex];
        const raw: string | undefined = rawArgs[argIndex];

        const types = flatTypesToUnion(decl.type);
        let success = false;
        let consumedRaw = false;

        for (const typeObj of types) {
            if (typeObj.base == 'user-mention' && typeObj.includeRefMessageAuthor) {
                let user: dsc.GuildMember | null = null;
                if (raw) {
                    user = await parseUser(raw, decl.name, context);
                }

                if (user) {
                    parsedArgs.push({ ...decl, type: typeObj, value: user } as CommandValuableArgument);
                    success = true;
                    consumedRaw = true;
                    break;
                }

                const refMember = await tryParseUserMentionOrRef(decl, context);
                if (refMember) {
                    parsedArgs.push({ ...decl, type: typeObj, value: refMember } as CommandValuableArgument);
                    success = true;
                    consumedRaw = false;
                    break;
                }
            } else {
                if (!raw) continue;

                const result = await tryParseArg(typeObj, raw, argIndex, rawArgs, decl, context);
                if (result) {
                    parsedArgs.push(result);
                    if ('trailing' in typeObj && typeObj.trailing) {
                        return parsedArgs;
                    }
                    success = true;
                    consumedRaw = true;
                    break;
                }
            }
        }

        if (success) {
            if (consumedRaw) argIndex++;
        } else {
            if (decl.optional) {
                parsedArgs.push({ ...decl } as CommandValuableArgument);
                continue;
            }
            if (!raw) throw new MissingRequiredArgError(decl.name, decl.type);
            throw new ArgMustBeSomeTypeError(decl.name, decl.type);
        }
    }

    return parsedArgs;
}
