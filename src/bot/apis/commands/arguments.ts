import { Timestamp } from '@/util/parseTimestamp.js';
import * as dsc from 'discord.js';
import Money from '@/util/money.js';

import type { Command } from './cmd.js';

export type CommandArgBaseType =
    | 'string'
    | 'user-mention'
    | 'channel-mention'
    | 'role-mention'
    | 'timestamp'
    | 'int'
    | 'float'
    | 'money'
    | 'command-ref';

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
    'money': Money;
    'command-ref': Command;
};

export type CommandValuableArgument = {
    [K in CommandArgBaseType]: CommandArgument & {
        type: Extract<CommandArgType, { base: K }>;
        value: CommandArgValueMap[K];
    }
}[CommandArgBaseType];
