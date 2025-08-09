import * as dsc from 'discord.js';

export interface Command {
    /* Command name */
    name: string;
    /* Command description */
    description: string;
    /* List of command aliases */
    aliases: string[];

    /* Array of role IDs that can execute the command. Everyone if null */
    allowedRoles: null | string[];

    /* Array of user IDs that can execute the command. Everyone if null */
    allowedUsers: null | string[];


    /* Function that executes the command */
    execute: (msg: dsc.OmitPartialGroupDMChannel<dsc.Message<boolean>>, args: string[]) => void;

    /* Function that returns the help field for the command */
    getHelp: () => dsc.APIEmbedField;
}