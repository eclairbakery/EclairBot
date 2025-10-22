import * as dsc from 'discord.js';

import { Category } from '@/bot/categories.js';
import { Timestamp } from '@/util/parseTimestamp.js';
export { Category };

export enum CommandFlags {
    None = 0,
    Spammy = 1 << 0,
    Important = 1 << 1,
    Economy = 1 << 2,
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

export interface CommandArgumentWithUserMentionValue extends CommandArgument {
    type: 'user-mention';
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
    | CommandArgumentWithTimestampValue
    | CommandArgumentWithUserMentionValue
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
    args: CommandValuableArgument[];
    getArg: (name: string) => CommandValuableArgument;
    getTypedArg(name: string, type: CommandArgType): CommandValuableArgument;
    msg: CommandMessageAPI;
    referenceMessage?: CommandMessageAPI;
    plainInteraction?: dsc.ChatInputCommandInteraction;
    plainMessage?: dsc.OmitPartialGroupDMChannel<dsc.Message<boolean>>;
    commands: Map<Category, Command[]>;
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

        /* Whether the command works in DM channels */
        worksInDM?: boolean;
    };
    /** The execute function */
    execute: (api: CommandAPI) => any | PromiseLike<any>;
}
