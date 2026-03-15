import User, { CooldownCheckResult } from "../db/user.ts";
import * as dsc from "discord.js";
import { CommandArgBaseType, CommandArgType, CommandArgValueMap, CommandValuableArgument, PreciseValuableArgument } from "./arguments.ts";
import { Category } from "@/bot/categories.ts";
import { Command } from "./cmd.ts";
import type * as log from "@/util/log.ts";
import { EconomyExecutor } from "../economy/action.ts";

export interface CommandAPI {
    // ---- COMMAND INFO ----
    getEnumArg<const O extends readonly string[]>(name: string, options: O): PreciseValuableArgument<{ base: "enum"; options: O }>;
    getTypedArg<T extends CommandArgType>(name: string, type: T): PreciseValuableArgument<T>;
    getTypedArg<B extends CommandArgBaseType>(name: string, base: B): Extract<CommandValuableArgument, { type: { base: B } }>;
    getTypedArg<B extends readonly CommandArgBaseType[]>(name: string, bases: B): Extract<CommandValuableArgument, { type: { base: B[number] } }>;
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
    reply: (options: string | dsc.MessagePayload | dsc.MessageReplyOptions | dsc.MessageReplyOptions | dsc.InteractionEditReplyOptions) => Promise<dsc.OmitPartialGroupDMChannel<dsc.Message<boolean>> | dsc.Message<boolean>>;

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
