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

loop:
    for (let i = 0; i < declaredArgs.length; i++) {
        const decl = declaredArgs[i];
        const raw = rawArgs[i];

        if (!raw) {
            if (!decl.optional) throw new Error(`Missing required argument: ${decl.name}`);
            parsedArgs.push({ ...decl } as any);
            continue;
        }

        if (decl.type === 'trailing-string' && context?.interaction) {
            decl.type = 'string';
        }

        switch (decl.type) {
            case 'string':
                parsedArgs.push({ ...decl, value: raw } as CommandArgumentWithStringValue);
                break;

            case 'trailing-string':
                const trailingValue = rawArgs.slice(i).join(' ');
                parsedArgs.push({ ...decl, value: trailingValue } as CommandArgumentWithStringValue);
                break loop;

            case 'number':
                const num = Number(raw);
                if (isNaN(num) && !decl.optional) throw new Error(`Argument ${decl.name} must be a number`);
                parsedArgs.push({ ...decl, value: isNaN(num) ? undefined : num } as CommandArgumentWithNumberValue);
                break;

            case 'timestamp': {
                const ts = parseTimestamp(raw);
                if (ts == null && !decl.optional) throw new Error(`Argument ${decl.name} must be a valid timestamp`);
                parsedArgs.push({ ...decl, value: ts } as CommandArgumentWithTimestampValue);
                break;
            }

            case 'user-mention': {
                let user: dsc.GuildMember | null = null;
                console.log(raw);
                if (context?.interaction) {
                    const member = (context.interaction as dsc.ChatInputCommandInteraction).options.getString(decl.name);
                    console.log(member);
                    user = parseMentionsFromStrings([member], context.interaction.guild).members.first();
                    if (!user) throw new Error('You need to mention the user.');
                } else if (raw) {
                    user = parseMentionsFromStrings([raw], context.msg.guild).members.first();
                    if (!user) throw new Error('You need to mention the user.');
                }

                if (user == null && !decl.optional) throw new Error(`Argument ${decl.name} must be a user mention`);
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

                if (role == null && !decl.optional) throw new Error(`Argument ${decl.name} must be a role mention`);
                parsedArgs.push({ ...decl, value: role } as CommandArgumentWithRoleMentionValue);
                break;
            }

            case 'channel-mention': {
                const match = raw.match(/^<#(\d+)>$/);
                const channelId = match?.[1];
                let channel: dsc.GuildChannel | null = null;

                if (channelId && context?.guild) {
                    const foundChannel = context.msg?.mentions.channels?.get(channelId) ?? context.guild.channels.cache.get(channelId);
                    if (foundChannel && foundChannel instanceof dsc.GuildChannel) {
                        channel = foundChannel;
                    }
                }

                if (channel == null && !decl.optional) throw new Error(`Argument ${decl.name} must be a channel mention`);
                parsedArgs.push({ ...decl, value: channel } as any);
                break;
            }

            default:
                parsedArgs.push({ ...decl } as any);
                break;
        }
    }

    return parsedArgs;
}