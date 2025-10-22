import * as log from '@/util/log.js';

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
    CommandMessageAPI
} from "@/bot/command.js";
import * as dsc from 'discord.js';
import parseTimestamp from "@/util/parseTimestamp.js";
import { getBalance } from '@/bot/apis/economy/apis.js';

export class ArgParseError extends Error {};

export class MissingRequiredArgError extends ArgParseError {
    public argName: string;
    public argType: CommandArgType;
    constructor(argName: string, argType: CommandArgType) { super(); this.argName = argName; this.argType = argType };
}

export class ArgMustBeSomeTypeError extends ArgParseError {
    public argName: string;
    public argType: CommandArgType;
    constructor(argName: string, argType: CommandArgType) { super(); this.argName = argName;  this.argType = argType; };
};

function parseMentionsFromStrings(args: string[], guild: dsc.Guild) {
    const users = new dsc.Collection<string, dsc.User>();
    const roles = new dsc.Collection<string, dsc.Role>();
    const members = new dsc.Collection<string, dsc.GuildMember>();
    const channels = new dsc.Collection<string, dsc.GuildChannel>();
    const userRegex = /^<@!?(\d+)>$/;
    const roleRegex = /^<@&(\d+)>$/;
    const channelRegex = /^<#(\d+)>$/;
    for (const arg of args) {
        let match: RegExpExecArray | null = null;
        if ((match = userRegex.exec(arg))) {
            const id = match[1];
            const user = guild.client.users.cache.get(id);
            if (user) users.set(id, user);
            const member = guild.members.cache.get(id);
            if (member) members.set(id, member);
        } else if ((match = roleRegex.exec(arg))) {
            const id = match[1];
            const role = guild.roles.cache.get(id);
            if (role) roles.set(id, role);
        } else if ((match = channelRegex.exec(arg))) {
            const id = match[1];
            const channel = guild.channels.cache.get(id);
            if (channel && channel.type !== dsc.ChannelType.PublicThread && channel.type !== dsc.ChannelType.PrivateThread) {
                channels.set(id, channel as dsc.GuildChannel);
            }
        }
    }
    return { users, roles, members, channels };
}

export async function parseArgs(
    rawArgs: string[],
    declaredArgs: CommandArgument[],
    context?: { msg?: dsc.Message; guild?: dsc.Guild; interaction?: dsc.CommandInteraction }
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
            if ((raw?.normalize('NFKC').trim().toLowerCase() ?? '') === 'all') {
                let x = context.interaction?.user.id ?? context.msg?.author.id ?? "someone";
                const balance = await getBalance(x);
                parsedArgs.push({ ...decl, value: balance.money } as CommandArgumentWithNumberValue);
                break;
            }
            const num = Number(raw?.replace(/[^\d.-]/g, '').trim() ?? '');
            if (isNaN(num)) {
                if (decl.optional) continue;
                throw new ArgMustBeSomeTypeError(decl.name, 'number');
            }
            parsedArgs.push({ ...decl, value: isNaN(num) ? undefined : num } as CommandArgumentWithNumberValue);
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
                user = parseMentionsFromStrings([member], context.interaction.guild).members.first();
                if (!user) {
                    user = await context.interaction.guild.members.fetch(member);
                }
            } else if (context?.msg) {
                user = parseMentionsFromStrings([raw], context.msg.guild).members.first();
                if (!user) {
                    const match = raw.match(/^<@!?(\d+)>$/);
                    const id = match?.[1] ?? raw;
                    user = await context.msg.guild.members.fetch(id);
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
                        user = parseMentionsFromStrings([member], context.interaction.guild).members.first();
                        if (!user) {
                            user = await context.interaction.guild.members.fetch(member);
                        }
                    } else if (context?.msg) {
                        user = parseMentionsFromStrings([raw], context.msg.guild).members.first();
                        if (!user) {
                            const match = raw.match(/^<@!?(\d+)>$/);
                            const id = match?.[1] ?? raw;
                            user = await context.msg.guild.members.fetch(id);
                        }
                    }
                } catch {}
            }

            if (user == null) {
                if (context?.msg && context?.msg?.reference) {
                    const refMessageId = context.msg.reference.messageId;
                    const refChannelId = context.msg.reference.channelId;

                    const channel = await context.msg.guild.channels.fetch(refChannelId);
                    if (channel && channel.isTextBased && channel.isTextBased()) {
                        const refMessage = await channel.messages.fetch({ message: refMessageId, force: false });
                        const member = await context.msg.guild.members.fetch(refMessage.author.id);

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
                role = context.msg?.mentions.roles?.get(roleId) ?? context.guild.roles.cache.get(roleId);
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

function formatArgType(argType: CommandArgType) {
    switch (argType) {
    case 'string':
    case 'trailing-string':
        return 'tekstem';

    case 'number':
        return 'liczbą';

    case 'timestamp':
        return 'znacznikiem czasu';

    case 'user-mention':
    case 'user-mention-or-reference-msg-author':
        return 'wzmianką użytkownika';

    case 'role-mention':
        return 'wzmianką roli';

    case 'channel-mention':
        return 'wzmianką kanału';
    }
}

export function handleError(err: any, msg: log.Replyable) {
    if (err instanceof ArgParseError) {
        if (err instanceof MissingRequiredArgError) {
            return log.replyError(
                msg, 'Błąd!',
                `No ten, jest problem! Ta komenda **oczekiwała argumentu ${err.argName}** który powinien być ${formatArgType(err.argType)}`
                    + ` ale jesteś zbyt głupi i go **nie podałeś!**`,
            );
        } else if (err instanceof ArgMustBeSomeTypeError) {
            return log.replyError(
                msg, 'Błąd!',
                `No ten, jest problem! Ta komenda **oczekiwała argumentu ${err.argName}** który powinien być ${formatArgType(err.argType)}`
                    + ` ale oczywście jesteś pacanem i **nie podałeś oczekiwanego formatu!** Nic tylko gratulować.`,
            );
        }
    } else {
        return log.replyError(
            msg, 'Błąd!',
            `Wystąpił błąd podczas wykonywania komendy: \`${String(err).replace('`', '\`')}\`.`
                + ` To nie powinno się stać! Proszę o powiadomienie o tym właścicieli bota... a jak nie... ||To nic się nie stanie 🤗||`
        );
    }
}
