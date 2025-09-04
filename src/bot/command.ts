import * as dsc from 'discord.js';

import { Category } from './categories.js';
import { Snowflake } from '../defs.js';
export { Category };

export interface CommandArgDef {
    name: string;
    desc: string;
}

/**
 * fully compatibile with dsc.Message
 */
export interface CommandInput {
    member: dsc.GuildMember,
    author: dsc.User,
    guild: dsc.Guild,
    channelId: string,
    /** legacy commands only */
    reference?: dsc.MessageReference,
    channel: dsc.TextBasedChannel,
    reply: (options: string | dsc.MessagePayload | dsc.MessageReplyOptions) => Promise<dsc.OmitPartialGroupDMChannel<dsc.Message<boolean>>> | dsc.Message<boolean>,
    client: dsc.Client,
    mentions: dsc.MessageMentions,
    [additional_fields: string | number | symbol]: any
}

export interface Command {
    /* Command name */
    name: string;
    /* Long command description */
    longDesc: string;
    /* Short description */
    shortDesc: string;
    /* Expected arguments for the command */
    expectedArgs: CommandArgDef[];
    /* List of command aliases */
    aliases: string[];

    /* Array of role IDs that can execute the command. */
    allowedRoles: string[] | null;
    /* Array of user IDs that can execute the command. Everyone if null */
    allowedUsers: null | string[];

    /* Function that executes the command */
    //execute: (msg: dsc.OmitPartialGroupDMChannel<dsc.Message<boolean>>, args: string[], commands: Command[]) => void;
    execute: (inp: CommandInput, args: string[], commands: Map<Category, Command[]>) => void | any | PromiseLike<any | void>;
}

export type NextGenerationCommandPermissionResorvable = 'administrator' | 'mute' | 'kick' | 'ban';

export interface NextGenerationCommandArgument {
    type: 'string' | 'user-mention' | 'channel-mention' | 'role-mention' | 'timestamp' | 'number';
    optional: boolean;
    name: string;
    description: string;
};

export interface NextGenerationCommandArgumentWithStringValue extends NextGenerationCommandArgument {
    type: 'string';
    value?: string;
};

export interface NextGenerationCommandArgumentWithUserMentionValue extends NextGenerationCommandArgument {
    type: 'user-mention';
    value?: dsc.GuildMember;
};

export interface NextGenerationCommandArgumentWithRoleMentionValue extends NextGenerationCommandArgument {
    type: 'role-mention';
    value?: dsc.Role;
};

export interface NextGenerationCommandArgumentWithTimestampValue extends NextGenerationCommandArgument {
    type: 'timestamp';
    value?: number;
};

export interface NextGenerationCommandArgumentWithNumberValue extends NextGenerationCommandArgument {
    type: 'number';
    value?: number;
};

export type NextGenerationCommandValuableArgument = NextGenerationCommandArgumentWithNumberValue | NextGenerationCommandArgumentWithRoleMentionValue | NextGenerationCommandArgumentWithStringValue | NextGenerationCommandArgumentWithTimestampValue | NextGenerationCommandArgumentWithUserMentionValue;

export interface NextGenerationCommandAPI {
    args: NextGenerationCommandValuableArgument[];
    getArg: (name: string) => NextGenerationCommandValuableArgument;
    getTypedArg: (name: string, type: NextGenerationCommandArgument["type"]) => NextGenerationCommandValuableArgument;
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
    referenceMessage?: NextGenerationCommandAPI["msg"];
    plainInteraction?: dsc.ChatInputCommandInteraction;
    plainMessage?: dsc.OmitPartialGroupDMChannel<dsc.Message<boolean>>; 
    commands: Map<Category, NextGenerationCommand[]>;
}

export interface NextGenerationCommand {
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
        discordPerms: NextGenerationCommandPermissionResorvable[] | null;
        /** the second thing in order, here you specify the snowflakes of the roles you'll use to grant permissions */
        allowedRoles: Snowflake[] | null,
        /** the last thing, allowed users */
        allowedUsers: Snowflake[] | null
    };
    /** A better argument system */
    args: NextGenerationCommandArgument[];
    /** Aliases for a command */
    aliases: string[];
    /** The execute function */
    execute: (api: NextGenerationCommandAPI) => any | PromiseLike<any>;
}