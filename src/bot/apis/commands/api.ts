import User, { CooldownCheckResult } from "../db/user.js";
import * as dsc from 'discord.js';
import { CommandArgBaseType, CommandArgValueMap, CommandValuableArgument } from "./arguments.js";
import { Category } from "@/bot/categories.js";
import { Command } from "./cmd.js";
import type * as log from '@/util/log.js';
import { EconomyExecutor } from "../economy/action.js";

export interface CommandAPI {
    // ---- COMMAND INFO ----
    getTypedArg<B extends CommandArgBaseType>(name: string, base: B): CommandValuableArgument & { type: { base: B }, value: CommandArgValueMap[B] };
    getTypedArg<B extends readonly CommandArgBaseType[]>(name: string, bases: B): CommandValuableArgument & { type: { base: B[number] }, value: CommandArgValueMap[B[number]] };
    invokedViaAlias: string;
    preferShortenedEmbeds: boolean;

    // ---- INVOKER -----
    invoker: {
        user: dsc.User;
        member?: dsc.GuildMember;
        id: dsc.Snowflake;
    };
    executor: User;
    
    // ---- RAW ----
    raw: {
        msg?: dsc.Message;
        interaction?: dsc.CommandInteraction;
    };

    // ---- FUNCTIONS ----
    reply: (options: string | dsc.MessagePayload | dsc.MessageReplyOptions | dsc.MessageReplyOptions | dsc.InteractionEditReplyOptions)
        => Promise<dsc.OmitPartialGroupDMChannel<dsc.Message<boolean>> | dsc.Message<boolean>>;

    checkCooldown: (field: string, cooldownMs: number) => Promise<CooldownCheckResult>;

    // ---- ECONOMY ----
    economy: EconomyExecutor;

    // ---- EXTERNAL DATA ----
    commands: Map<Category, Command[]>;
    log: typeof log;

    // ---- EXEC LOCATION ----
    guild?: dsc.Guild;
    channel: dsc.Channel | dsc.GuildChannel; 
}

