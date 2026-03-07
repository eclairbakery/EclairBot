import { Timestamp } from '@/util/parseTimestamp.js';
import * as dsc from 'discord.js';

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
