import { Category } from '@/bot/categories.js';
export { Category };

import { Command } from './apis/commands/cmd.js';
import { CommandAPI } from './apis/commands/api.js';
import {
    CommandArgument,
    CommandValuableArgument, 
    CommandArgType, 
} from './apis/commands/arguments.js';
import { CommandViolatedRule } from './apis/commands/misc.js';

export type { 
    Command, 
    CommandAPI, 
    CommandArgument, 
    CommandArgType, 
    CommandValuableArgument, 
    CommandViolatedRule
};
