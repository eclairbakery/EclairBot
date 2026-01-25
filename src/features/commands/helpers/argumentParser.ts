import * as dsc from 'discord.js';
import { Command, CommandArgument, CommandFlags, CommandValuableArgument } from "@/bot/command.js";
import User from "@/bot/apis/db/user.js";
import { ArgMustBeSomeTypeError, MissingRequiredArgError } from "../defs/errors.js";

const SNOWFLAKE_REGEX = /^\d{17,20}$/;

function getSnowflake(input: string): string | null {
    if (!input) return null;
    // Wyciąga ID z formatu <@!123>, <@123>, <#123>, <@&123> lub czyste ID
    const match = input.match(/\d{17,20}/);
    return match ? match[0] : null;
}

async function resolveMember(guild: dsc.Guild, id: string): Promise<dsc.GuildMember | null> {
    if (!SNOWFLAKE_REGEX.test(id)) return null;
    try {
        return await guild.members.fetch(id);
    } catch {
        return null;
    }
}

async function resolveUserFromContext(
    raw: string | undefined,
    context: { msg?: dsc.Message; interaction?: dsc.CommandInteraction; guild?: dsc.Guild }
): Promise<dsc.GuildMember | null> {
    const guild = context.guild ?? context.msg?.guild ?? context.interaction?.guild;
    if (!guild) return null;

    if (context.interaction?.isChatInputCommand()) {
        const member = context.interaction.options.getMember('user');
        if (member instanceof dsc.GuildMember) return member;
        
        const id = context.interaction.options.getString('user');
        return id ? resolveMember(guild, id) : null;
    }

    if (raw) {
        const id = getSnowflake(raw);
        console.log('id: ' + id + ' while raw is ' + raw);
        if (!id) return null;
        return resolveMember(guild, id);
    }

    return null;
}

export async function parseArgs(
    rawArgs: string[],
    declaredArgs: CommandArgument[],
    context: { msg?: dsc.Message; guild?: dsc.Guild; interaction?: dsc.CommandInteraction; cmd?: Command }
): Promise<CommandValuableArgument[]> {
    const parsed: CommandValuableArgument[] = [];
    const isInteraction = !!context.interaction;
    let argIndex = 0;

    for (const decl of declaredArgs) {
        let raw = rawArgs[argIndex];
        const { type } = decl;

        if (raw === undefined || raw === null) {
            if (type === "user-mention-or-reference-msg-author" && context.msg) {
                const refId = context.msg.reference?.messageId;
                let member: dsc.GuildMember | null = null;
                
                if (refId) {
                    const refMsg = await context.msg.channel.messages.fetch(refId).catch(() => null);
                    if (refMsg) member = await resolveMember(context.msg.guild!, refMsg.author.id);
                }
                
                parsed.push({ ...decl, value: member ?? context.msg.member } as CommandValuableArgument);
                continue; 
            }

            if (!decl.optional) throw new MissingRequiredArgError(decl.name, type);
            parsed.push({ ...decl, value: undefined } as any);
            continue;
        }

        switch (type) {
            case "string":
                parsed.push({ ...decl, value: raw } as any);
                break;

            case "trailing-string":
                parsed.push({ ...decl, value: rawArgs.slice(argIndex).join(" ") } as any);
                return parsed;

            case "number": {
                const normalized = raw.toLowerCase();
                if (normalized === "all" && context.cmd?.flags === CommandFlags.Economy) {
                    const userId = context.interaction?.user.id ?? context.msg?.author.id;
                    const bal = await new User(userId!).economy.getBalance();
                    parsed.push({ ...decl, value: bal.wallet } as any);
                } else {
                    const num = Number(raw.replace(',', '.'));
                    if (isNaN(num)) throw new ArgMustBeSomeTypeError(decl.name, "number");
                    parsed.push({ ...decl, value: num } as any);
                }
                break;
            }

            case "user-mention":
            case "user-mention-or-reference-msg-author": {
                const member = await resolveUserFromContext(raw, context);
                if (!member) throw new ArgMustBeSomeTypeError(decl.name, "user-mention");
                parsed.push({ ...decl, value: member } as any);
                break;
            }

            case "role-mention": {
                const id = getSnowflake(raw);
                const role = id ? await context.guild?.roles.fetch(id).catch(() => null) : null;
                if (!role) throw new ArgMustBeSomeTypeError(decl.name, "role-mention");
                parsed.push({ ...decl, value: role } as any);
                break;
            }

            case "channel-mention": {
                const id = getSnowflake(raw);
                const channel = id ? await context.guild?.channels.fetch(id).catch(() => null) : null;
                if (!channel) throw new ArgMustBeSomeTypeError(decl.name, "channel-mention");
                parsed.push({ ...decl, value: channel as any });
                break;
            }

            default:
                parsed.push({ ...decl, value: raw } as any);
        }

        argIndex++;
    }

    return parsed;
}