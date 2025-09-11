import {
    CommandArgument,
    CommandValuableArgument,
    CommandArgumentWithStringValue,
    CommandArgumentWithNumberValue,
    CommandArgumentWithTimestampValue,
    CommandArgumentWithUserMentionValue,
    CommandArgumentWithRoleMentionValue
} from "@/bot/command.js";
import * as dsc from 'discord.js';
import parseTimestamp from "@/util/parseTimestamp.js";
import debugLog from "@/util/debugLog.js";

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

        let declType: string = decl.type;
        if (!context?.msg) {
            if (decl.type == 'trailing-string') {
                declType = 'string';
            } else if (decl.type == 'user-mention-or-reference-msg-author') {
                declType = 'user-mention';
            }
        }

        if (!raw && declType != 'user-mention-or-reference-msg-author') {
            if (!decl.optional) throw new Error(`Missing required argument: ${decl.name}`);
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
            console.log(`Parsed trailing-string argument ${decl.name}:`, trailingValue);
            break loop;
        }

        case 'number': {
            const num = Number(raw);
            if (isNaN(num)) {
                if (decl.optional) continue;
                else throw new Error(`Argument ${decl.name} must be a number`);
            }
            parsedArgs.push({ ...decl, value: isNaN(num) ? undefined : num } as CommandArgumentWithNumberValue);
            break;
        }

        case 'timestamp': {
            const ts = parseTimestamp(raw);
            if (ts == null) {
                if (decl.optional) continue;
                else throw new Error(`Argument ${decl.name} must be a valid timestamp`);
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
                else throw new Error(`Argument ${decl.name} must be a user mention or ID`);
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

                if (!raw) throw new Error(`Missing required argument: ${decl.name}`);

                if (decl.optional) continue;
                else throw new Error(`Argument ${decl.name} must be a user mention or ID`);
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
                else throw new Error(`Argument ${decl.name} must be a role mention`);
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
                else throw new Error(`Argument ${decl.name} must be a channel mention`);
            }
            parsedArgs.push({ ...decl, value: channel } as any);
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