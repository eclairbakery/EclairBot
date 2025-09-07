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

export async function parseArgs(
    rawArgs: string[],
    declaredArgs: CommandArgument[],
    context?: { msg?: dsc.Message; guild?: dsc.Guild; interaction?: dsc.CommandInteraction }
): Promise<CommandValuableArgument[]> {
    const parsedArgs: CommandValuableArgument[] = [];

    for (let i = 0; i < declaredArgs.length; i++) {
        const decl = declaredArgs[i];
        const raw = rawArgs[i];

        if (!raw) {
            if (!decl.optional) throw new Error(`Missing required argument: ${decl.name}`);
            parsedArgs.push({ ...decl } as any);
            continue;
        }

        switch (decl.type) {
            case 'string':
                parsedArgs.push({ ...decl, value: raw } as CommandArgumentWithStringValue);
                break;

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
                let user: dsc.GuildMember | undefined;
                if (context?.interaction) {
                    // slash command
                    const member = (context.interaction as dsc.ChatInputCommandInteraction).options.getMember(decl.name);
                    // @ts-ignore
                    if (member?.guild) user = member as dsc.GuildMember;
                } else if (raw) {
                    const match = raw.match(/^<@!?(\d+)>$/);
                    const userId = match?.[1];
                    if (userId && context?.guild) {
                        user = context.msg?.mentions.members?.get(userId) ?? context.guild.members.cache.get(userId);
                        if (!user) {
                            try { user = await context.guild.members.fetch(userId); } catch {}
                        }
                    }
                }

                if (!user && !decl.optional) throw new Error(`Argument ${decl.name} must be a user mention`);
                parsedArgs.push({ ...decl, value: user } as CommandArgumentWithUserMentionValue);
                break;
            }

            case 'role-mention': {
                const match = raw.match(/^<@&(\d+)>$/);
                const roleId = match?.[1];
                let role: dsc.Role | undefined;

                if (roleId && context?.guild) {
                    role = context.msg?.mentions.roles?.get(roleId) ?? context.guild.roles.cache.get(roleId);
                }

                if (!role && !decl.optional) throw new Error(`Argument ${decl.name} must be a role mention`);
                parsedArgs.push({ ...decl, value: role } as CommandArgumentWithRoleMentionValue);
                break;
            }

            case 'channel-mention': {
                const match = raw.match(/^<#(\d+)>$/);
                const channelId = match?.[1];
                let channel: dsc.GuildChannel | undefined;

                if (channelId && context?.guild) {
                    // tajpskrypt cicho
                    // @ts-expect-error
                    channel = context.msg?.mentions.channels?.get(channelId) ?? context.guild.channels.cache.get(channelId);
                }

                if (!channel && !decl.optional) throw new Error(`Argument ${decl.name} must be a channel mention`);
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