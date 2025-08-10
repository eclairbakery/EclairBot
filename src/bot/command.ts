import * as dsc from 'discord.js';

export interface CommandArgDef {
    name: string;
    desc: string;
}

export interface Command {
    /* Command name */
    name: string;
    /* Command description */
    desc: string;
    /* Expected arguments for the command */
    expectedArgs: CommandArgDef[];
    /* List of command aliases */
    aliases: string[];

    /* Array of role IDs that can execute the command. */
    allowedRoles: string[];
    /* Array of user IDs that can execute the command. Everyone if null */
    allowedUsers: null | string[];

    category: string

    /* Function that executes the command */
    execute: (msg: dsc.OmitPartialGroupDMChannel<dsc.Message<boolean>>, args: string[], commands: Command[]) => void;
}