import { Category } from "@/bot/categories.ts";
export { Category };

import { Command } from "./apis/commands/cmd.ts";
import { CommandAPI } from "./apis/commands/api.ts";
import { CommandArgType, CommandArgument, CommandValuableArgument } from "./apis/commands/arguments.ts";
import { CommandViolatedRule } from "./apis/commands/misc.ts";

export type { Command, CommandAPI, CommandArgType, CommandArgument, CommandValuableArgument, CommandViolatedRule };
