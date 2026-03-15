import * as dsc from "discord.js";
import { CommandAPI } from "./api.ts";
import { CommandArgument } from "./arguments.ts";
import { CommandFlags } from "@/bot/apis/commands/misc.ts";

export interface Command {
    name: string;
    /** Aliases for a command */
    aliases: string[];
    /** Command descriptions */
    description: {
        /** The long description of the command */
        main: string;
        /** Shorter version which will try to handle discord.js internal limits */
        short: string;
    };
    flags: CommandFlags;

    /** A better argument system */
    expectedArgs: CommandArgument[];

    /** Command permissions */
    permissions: {
        /** the second thing in order, here you specify the snowflakes of the roles you'll use to grant permissions */
        allowedRoles: dsc.Snowflake[] | null;
        /** the last thing, allowed users */
        allowedUsers: dsc.Snowflake[] | null;
    };
    /** The execute function */
    execute: (api: CommandAPI) => any | PromiseLike<any>;
}
