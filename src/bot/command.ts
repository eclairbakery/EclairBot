import * as dsc from 'discord.js';

import { Category } from './categories.js';
import { Snowflake } from '../defs.js';
export { Category };

export type CommandPermissionResorvable = 'administrator' | 'mute' | 'kick' | 'ban';

export interface CommandArgument {
    type: 'string' | 'user-mention' | 'channel-mention' | 'role-mention' | 'timestamp' | 'number';
    optional: boolean;
    name: string;
    description: string;
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

export interface CommandArgumentWithTimestampValue extends CommandArgument {
    type: 'timestamp';
    value?: number;
};

export interface CommandArgumentWithNumberValue extends CommandArgument {
    type: 'number';
    value?: number;
};

export type CommandValuableArgument = CommandArgumentWithNumberValue | CommandArgumentWithRoleMentionValue | CommandArgumentWithStringValue | CommandArgumentWithTimestampValue | CommandArgumentWithUserMentionValue;

export interface CommandAPI {
    args: CommandValuableArgument[];
    getArg: (name: string) => CommandValuableArgument;
    getTypedArg: (name: string, type: CommandArgument['type']) => CommandValuableArgument;
    msg: {
        content: string;
        author: {
            id: Snowflake;
            plainUser: dsc.User;
        };
        member: {
            id: Snowflake;
            moderation: {
                warn: (data: { reason: string; expiresAt: number; points: number; }) => Promise<any>;
                mute: (data: { reason: string; duration: number; }) => Promise<any>;
                kick: (data: { reason: string; }) => Promise<any>;
                ban: (data: { reason: string; expiresAt: number; }) => Promise<any>;
            }
            plainMember: dsc.GuildMember
        };
        reply: (options: string | dsc.MessagePayload | dsc.MessageReplyOptions | dsc.MessageReplyOptions | dsc.InteractionEditReplyOptions) => Promise<dsc.OmitPartialGroupDMChannel<dsc.Message<boolean>> | dsc.Message<boolean>>;
        mentions: { members: dsc.Collection<Snowflake, dsc.GuildMember>, roles: dsc.Collection<Snowflake, dsc.Role>, channels: dsc.Collection<string, dsc.Channel>, users: dsc.Collection<Snowflake, dsc.User> };
        guild?: dsc.Guild;
        channel: dsc.Channel | dsc.GuildChannel
    };
    referenceMessage?: CommandAPI['msg'];
    plainInteraction?: dsc.ChatInputCommandInteraction;
    plainMessage?: dsc.OmitPartialGroupDMChannel<dsc.Message<boolean>>;
    commands: Map<Category, Command[]>;
}

export interface Command {
    name: string;
    description: {
        /** the long description of the command */
        main: string;
        /** shorter version which will try to handle discord.js internal limits */
        short: string;
    };
    /** WARNING: SETTING ANY VALUE TO NULL WILL MAKE EVERYONE POSSIBLE TO USE THIS COMMAND, if you want to skip something and don't let them use the command, use the empty array */
    permissions: {
        /** the first thing that grants you permissions to use this command, here specify the discord permission; global perm not for the channel */
        discordPerms: CommandPermissionResorvable[] | null;
        /** the second thing in order, here you specify the snowflakes of the roles you'll use to grant permissions */
        allowedRoles: Snowflake[] | null,
        /** the last thing, allowed users */
        allowedUsers: Snowflake[] | null
    };
    /** A better argument system */
    expectedArgs: CommandArgument[];
    /** Aliases for a command */
    aliases: string[];
    /** The execute function */
    execute: (api: CommandAPI) => any | PromiseLike<any>;
}