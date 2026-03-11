import { Timestamp } from '@/util/parseTimestamp.js';
import * as dsc from 'discord.js';

import type { Command } from './cmd.js';

export type CommandArgBaseType =
    | 'string'
    | 'user-mention'
    | 'channel-mention'
    | 'role-mention'
    | 'timestamp'
    | 'int'
    | 'float'
    | 'command-ref';

export type CommandArgType = 
    | { base: 'string', trailing?: boolean }
    | { base: 'user-mention', includeRefMessageAuthor?: boolean }
    | { base: 'role-mention' }
    | { base: 'channel-mention' }
    | { base: 'timestamp' }
    | { base: 'int' }
    | { base: 'float' }
    | { base: 'command-ref' }
    | { base: 'union', variants: CommandArgType[] };

export interface CommandArgument {
    name: string;
    description: string;
    type: CommandArgType;
    optional: boolean;
};

export type CommandArgValueMap = {
    'string': string;
    'user-mention': dsc.GuildMember;
    'role-mention': dsc.Role;
    'channel-mention': dsc.GuildChannel;
    'timestamp': Timestamp;
    'int': bigint;
    'float': number;
    'command-ref': Command;
};

export type CommandValuableArgument<T extends { base: string } = any> = CommandArgument & {
    type: T;
    value?: T extends { base: 'union', variants: (infer V)[] }
        ? (V extends { base: keyof CommandArgValueMap } ? CommandArgValueMap[V['base']] : any)
        : T['base'] extends keyof CommandArgValueMap ? CommandArgValueMap[T['base']] : any;
};
