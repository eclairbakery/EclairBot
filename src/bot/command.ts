import * as dsc from 'discord.js';

import { Category } from '@/bot/categories.js';
import { Timestamp } from '@/util/parseTimestamp.js';
export { Category };
import type * as log from '@/util/log.js';

export enum CommandFlags {
    None = 0,

    // command flags: command blocking by category
    Spammy = 1 << 0,
    Important = 1 << 1,
    Economy = 1 << 2,

    // command flags: other command blocking
    WorksInDM = 1 << 3,

    // command flags: slash cmds specific
    Ephemeral = 1 << 4,
};

export type CommandPermissionResolvable = 'administrator' | 'mute' | 'kick' | 'ban';

export type CommandArgType =
    | 'string' | 'trailing-string'
    | 'user-mention' | 'user-mention-or-reference-msg-author'
    | 'channel-mention'
    | 'role-mention'
    | 'timestamp'
    | 'number';

export interface CommandArgument {
    name: string;
    description: string;
    type: CommandArgType;
    optional: boolean;
};

export interface CommandArgumentWithStringValue extends CommandArgument {
    type: 'string';
    value?: string;
};

export interface CommandArgumentWithTrailStringValue extends CommandArgument {
    type: 'trailing-string';
    value?: string;
};

export interface CommandArgumentWithUserMentionValue extends CommandArgument {
    type: 'user-mention';
    value?: dsc.GuildMember;
};

export interface CommandArgumentWithUserMentionOrMsgReferenceValue extends CommandArgument {
    type: 'user-mention-or-reference-msg-author';
    value?: dsc.GuildMember;
};

export interface CommandArgumentWithRoleMentionValue extends CommandArgument {
    type: 'role-mention';
    value?: dsc.Role;
};

export interface CommandArgumentWithChannelMentionValue extends CommandArgument {
    type: 'channel-mention';
    value?: dsc.GuildChannel;
};

export interface CommandArgumentWithTimestampValue extends CommandArgument {
    type: 'timestamp';
    value?: Timestamp;
};

export interface CommandArgumentWithNumberValue extends CommandArgument {
    type: 'number';
    value?: number;
};

export type CommandValuableArgument =
    | CommandArgumentWithNumberValue
    | CommandArgumentWithRoleMentionValue
    | CommandArgumentWithChannelMentionValue
    | CommandArgumentWithStringValue
    | CommandArgumentWithTrailStringValue
    | CommandArgumentWithTimestampValue
    | CommandArgumentWithUserMentionValue
    | CommandArgumentWithUserMentionOrMsgReferenceValue
    ;;

export interface CommandMessageAPI {
    content: string;
    author: {
        id: dsc.Snowflake;
        plainUser: dsc.User;
    };
    member?: {
        id: dsc.Snowflake;
        moderation: {
            warn: (data: { reason: string; expiresAt: number; points: number; }) => Promise<any>;
            mute: (data: { reason: string; duration: number; }) => Promise<any>;
            kick: (data: { reason: string; }) => Promise<any>;
            ban:  (data: { reason: string; expiresAt: number; }) => Promise<any>;
        }
        plainMember: dsc.GuildMember;
    };
    reply:
        (options: string | dsc.MessagePayload | dsc.MessageReplyOptions | dsc.MessageReplyOptions | dsc.InteractionEditReplyOptions)
        => Promise<dsc.OmitPartialGroupDMChannel<dsc.Message<boolean>> | dsc.Message<boolean>>;

    /** @deprecated */
    mentions: {
        members: dsc.Collection<dsc.Snowflake, dsc.GuildMember>;
        roles: dsc.Collection<dsc.Snowflake, dsc.Role>;
        channels: dsc.Collection<string, dsc.Channel>;
        users: dsc.Collection<dsc.Snowflake, dsc.User>;
    };
    guild?: dsc.Guild;
    channel: dsc.Channel | dsc.GuildChannel
};

export interface CommandAPI {
    // ---- ARGS ----
    args: CommandValuableArgument[];
    /** @deprecated */
    getArg: (name: string) => CommandValuableArgument;
    getTypedArg<T extends CommandArgType>(name: string, type: T): Extract<CommandValuableArgument, { type: T }>;

    // ---- MSGS ----
    msg: CommandMessageAPI;
    referenceMessage?: CommandMessageAPI;
    plainInteraction?: dsc.ChatInputCommandInteraction;
    plainMessage?: dsc.OmitPartialGroupDMChannel<dsc.Message<boolean>>;

    // ---- QUICK FUNCTIONS ----
    reply: (options: string | dsc.MessagePayload | dsc.MessageReplyOptions | dsc.MessageReplyOptions | dsc.InteractionEditReplyOptions)
        => Promise<dsc.OmitPartialGroupDMChannel<dsc.Message<boolean>> | dsc.Message<boolean>>;

    // ---- EXTERNAL DATA ----
    commands: Map<Category, Command[]>;
    log: typeof log;
    guild?: dsc.Guild;
    channel: dsc.Channel | dsc.GuildChannel
}

export interface Command {
    name: string;
    /** Aliases for a command */
    aliases: string[];
    description: {
        /** the long description of the command */
        main: string;
        /** shorter version which will try to handle discord.js internal limits */
        short: string;
    };
    flags: CommandFlags;

    /** A better argument system */
    expectedArgs: CommandArgument[];
    /** WARNING: SETTING ANY VALUE TO NULL WILL MAKE EVERYONE POSSIBLE TO USE THIS COMMAND, if you want to skip something and don't let them use the command, use the empty array */
    permissions: {
        /** the first thing that grants you permissions to use this command, here specify the discord permission; global perm not for the channel */
        discordPerms: CommandPermissionResolvable[] | null;
        /** the second thing in order, here you specify the snowflakes of the roles you'll use to grant permissions */
        allowedRoles: dsc.Snowflake[] | null;
        /** the last thing, allowed users */
        allowedUsers: dsc.Snowflake[] | null;
    };
    /** The execute function */
    execute: (api: CommandAPI) => any | PromiseLike<any>;
}

const xd: `${`${`${`${`${`${`${`${`${`${`${`${`${`${`${`${`${`${`${`${`${`${`${`${`${`${`${`${`${`${`${`${`${`${`${`${`${`${string}`}`}`}`}`}`}`}`}`}`}`}`}`}`}`}`}`}`}`}`}`}`}`}`}`}`}`}`}`}`}`}`}`}`}`}`}`}` = '';