import { Timestamp } from '@/util/parseTimestamp.ts';
import * as dsc from 'discord.js';
import Money from '@/util/money.ts';

import type { Command } from './cmd.ts';

export type CommandArgBaseType =
    | 'string'
    | 'user-mention'
    | 'channel-mention'
    | 'role-mention'
    | 'timestamp'
    | 'int'
    | 'float'
    | 'money'
    | 'command-ref'
    | 'enum';

export type CommandArgType = 
    | { base: 'string', trailing?: boolean }
    | { base: 'user-mention', includeRefMessageAuthor?: boolean }
    | { base: 'role-mention' }
    | { base: 'channel-mention' }
    | { base: 'timestamp' }
    | { base: 'int' }
    | { base: 'float' }
    | { base: 'money', source?: 'wallet' | 'bank' }
    | { base: 'command-ref' }
    | { base: 'enum', trailing?: boolean, options: readonly string[] }
    | { base: 'union', variants: readonly CommandArgType[] };

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
    'money': Money;
    'command-ref': Command;
    'enum': string;
};

export type ResolveArgValue<T extends CommandArgType> = 
    T extends { base: 'enum', options: infer O } ? (O extends readonly string[] ? O[number] : string) :
    T extends { base: 'union', variants: infer V } ? (V extends readonly CommandArgType[] ? ResolveArgValue<V[number]> : never) :
    T extends { base: infer B } ? (B extends keyof CommandArgValueMap ? CommandArgValueMap[B] : never) :
    never;

export type CommandValuableArgument = {
    [K in CommandArgBaseType]: CommandArgument & {
        type: Extract<CommandArgType, { base: K }>;
        value: K extends 'enum' ? string : CommandArgValueMap[K];
    }
}[CommandArgBaseType];

// Do precyzyjnego typowania w kodzie komendy:
export type PreciseValuableArgument<T extends CommandArgType> = CommandArgument & {
    type: T;
    value: ResolveArgValue<T>;
};
