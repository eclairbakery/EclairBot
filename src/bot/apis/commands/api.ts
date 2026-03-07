import User, { CooldownCheckResult } from "../db/user.js";
import * as dsc from 'discord.js';
import { CommandArgType, CommandValuableArgument } from "./arguments.js";
import { Category } from "@/bot/categories.js";
import { Command } from "./cmd.js";
import type * as log from '@/util/log.js';

export interface CommandAPI {
    // ---- COMMAND INFO ----
    getTypedArg<T extends CommandArgType>(name: string, type: T): Extract<CommandValuableArgument, { type: T }>;
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

    // ---- EXTERNAL DATA ----
    commands: Map<Category, Command[]>;
    log: typeof log;

    // ---- EXEC LOCATION ----
    guild?: dsc.Guild;
    channel: dsc.Channel | dsc.GuildChannel; 
}

