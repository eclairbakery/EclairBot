import {
    CommandArgument,
    CommandValuableArgument,
    CommandArgumentWithStringValue,
    CommandArgumentWithNumberValue,
    CommandArgumentWithTimestampValue,
    CommandArgumentWithUserMentionValue,
    CommandArgumentWithRoleMentionValue,
    CommandArgumentWithChannelMentionValue,
    CommandArgType,
    CommandMessageAPI,
    Command,
    CommandFlags
} from "@/bot/command.js";
import * as dsc from 'discord.js';
import parseTimestamp from "@/util/parseTimestamp.js";
import { getBalance } from '@/bot/apis/economy/apis.js';
import { output } from '@/bot/logging.js';
import { ArgMustBeSomeTypeError, MissingRequiredArgError } from "../defs/errors.js";
import { parseMentionsFromStrings } from "./mentions.js";

export async function parseArgs(
    rawArgs: string[],
    declaredArgs: CommandArgument[],
    context?: { msg?: dsc.Message; guild?: dsc.Guild; interaction?: dsc.CommandInteraction; cmd?: Command }
): Promise<CommandValuableArgument[]> {
    const parsedArgs: CommandValuableArgument[] = [];

    let argIndex = 0;

loop:
    for (let declIndex = 0; declIndex < declaredArgs.length; ++declIndex) {
        const decl: CommandArgument = declaredArgs[declIndex];
        const raw: string | undefined = rawArgs[argIndex];

        let declType: CommandArgType = decl.type;
        if (!context?.msg) {
            if (decl.type == 'trailing-string') {
                declType = 'string';
            } else if (decl.type == 'user-mention-or-reference-msg-author') {
                declType = 'user-mention';
            }
        }

        if (!raw && declType != 'user-mention-or-reference-msg-author') {
            if (!decl.optional) throw new MissingRequiredArgError(decl.name, declType);
            parsedArgs.push({ ...decl } as any);
            continue;
        }

        switch (declType) {
        case 'string': {
            parsedArgs.push({ ...decl, value: raw } as CommandArgumentWithStringValue);
            break;
        }

        case 'trailing-string': {
            const trailingValue = rawArgs.slice(argIndex).join(' ');
            parsedArgs.push({ ...decl, value: trailingValue } as CommandArgumentWithStringValue);
            break loop;
        }

        case 'number': {
            if ((raw?.normalize('NFKC').trim().toLowerCase() ?? '') === 'all' && (context?.cmd?.flags ?? CommandFlags.None) == CommandFlags.Economy) {
                let x = context?.interaction?.user.id ?? context?.msg?.author.id ?? "someone";
                const balance = await getBalance(x);
                parsedArgs.push({ ...decl, value: balance.money } as CommandArgumentWithNumberValue);
                break;
            }
            const rawIsNumber = /^-?\d+(\.\d+)?$/.test(raw ?? '');
            if (!rawIsNumber) {
                if (decl.optional) {
                    continue;
                }
                throw new ArgMustBeSomeTypeError(decl.name, 'number');
            }
            const num = Number(raw);
            parsedArgs.push({ ...decl, value: num } as CommandArgumentWithNumberValue);
            break;
        }

        case 'timestamp': {
            const ts = parseTimestamp(raw);
            if (ts == null) {
                if (decl.optional) continue;
                throw new ArgMustBeSomeTypeError(decl.name, 'timestamp');
            }
            parsedArgs.push({ ...decl, value: ts } as CommandArgumentWithTimestampValue);
            break;
        }

        case 'user-mention': {
            let user: dsc.GuildMember | null = null;
            if (context?.interaction) {
                const member = (context.interaction as dsc.ChatInputCommandInteraction).options.getString(decl.name);
                user = parseMentionsFromStrings([member!], context.interaction.guild!).members.first() ?? null;
                if (!user) {
                    user = await context.interaction.guild!.members.fetch(member!);
                }
            } else if (context?.msg) {
                user = parseMentionsFromStrings([raw], context.msg.guild!).members.first() ?? null;
                if (!user) {
                    const match = raw.match(/^<@!?(\d+)>$/);
                    const id = match?.[1] ?? raw;
                    user = await context.msg.guild!.members.fetch(id);
                }
            }

            if (user == null) {
                if (decl.optional) continue;
                throw new ArgMustBeSomeTypeError(decl.name, 'user-mention');
            }
            parsedArgs.push({ ...decl, value: user } as CommandArgumentWithUserMentionValue);
            break;
        }

        case 'user-mention-or-reference-msg-author': {
            let user: dsc.GuildMember | null = null;
            if (raw) {
                try {
                    if (context?.interaction) {
                        const member = (context.interaction as dsc.ChatInputCommandInteraction).options.getString(decl.name);
                        user = parseMentionsFromStrings([member!], context.interaction.guild!).members.first() ?? null;
                        if (!user) {
                            user = await context.interaction.guild!.members.fetch(member!);
                        }
                    } else if (context?.msg) {
                        user = parseMentionsFromStrings([raw], context.msg.guild!).members.first() ?? null;
                        if (!user) {
                            const match = raw.match(/^<@!?(\d+)>$/);
                            const id = match?.[1] ?? raw;
                            user = await context.msg.guild!.members.fetch(id);
                        }
                    }
                } catch {}
            }

            if (user == null) {
                if (context?.msg && context?.msg?.reference) {
                    const refMessageId = context.msg.reference.messageId;
                    const refChannelId = context.msg.reference.channelId;

                    const channel = await context.msg.guild!.channels.fetch(refChannelId);
                    if (channel && channel.isTextBased && channel.isTextBased()) {
                        const refMessage = await channel.messages.fetch({ message: refMessageId ?? '', force: false });
                        const member = await context.msg.guild!.members.fetch(refMessage.author.id);

                        if (member) {
                            parsedArgs.push({ ...decl, value: member } as CommandArgumentWithUserMentionValue);
                            continue loop;
                        }
                    }
                }

                if (!raw) throw new MissingRequiredArgError(decl.name, declType);

                if (decl.optional) continue;
                throw new ArgMustBeSomeTypeError(decl.name, 'user-mention-or-reference-msg-author');
            }

            parsedArgs.push({ ...decl, value: user } as CommandArgumentWithUserMentionValue);
            break;
        }

        case 'role-mention': {
            const match = raw.match(/^<@&(\d+)>$/);
            const roleId = match?.[1];
            let role: dsc.Role | null = null;

            if (roleId && context?.guild) {
                role = context.msg?.mentions.roles?.get(roleId) ?? context.guild.roles.cache.get(roleId) ?? null;
            }

            if (role == null) {
                if (decl.optional) continue;
                throw new ArgMustBeSomeTypeError(decl.name, 'role-mention');
            }
            parsedArgs.push({ ...decl, value: role } as CommandArgumentWithRoleMentionValue);
            break;
        }

        case 'channel-mention': {
            const match = raw.match(/^<#(\d+)>$/);
            const channelID = match?.[1];
            let channel: dsc.GuildChannel | null = null;

            if (channelID && context?.guild) {
                const foundChannel = context.msg?.mentions.channels?.get(channelID) ?? context.guild.channels.cache.get(channelID);
                if (foundChannel && foundChannel instanceof dsc.GuildChannel) {
                    channel = foundChannel;
                }
            }

            if (channel == null) {
                if (decl.optional) continue;
                throw new ArgMustBeSomeTypeError(decl.name, 'channel-mention');
            }
            parsedArgs.push({ ...decl, value: channel } as CommandArgumentWithChannelMentionValue);
            break;
        }

        default:
            parsedArgs.push({ ...decl } as any);
            break;
        }

        ++argIndex;
    }

    return parsedArgs;
}