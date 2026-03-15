import { Category } from '@/bot/categories.ts';
export { Category };

import { Command } from './apis/commands/cmd.ts';
import { CommandAPI } from './apis/commands/api.ts';
import {
    CommandArgument,
    CommandValuableArgument, 
    CommandArgType, 
} from './apis/commands/arguments.ts';
import { CommandViolatedRule } from './apis/commands/misc.ts';

export type { 
    Command, 
    CommandAPI, 
    CommandArgument, 
    CommandArgType, 
    CommandValuableArgument, 
    CommandViolatedRule
};
