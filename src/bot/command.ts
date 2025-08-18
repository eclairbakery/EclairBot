import * as dsc from 'discord.js';

import { Category } from './categories.js';
export { Category };

export interface CommandArgDef {
    name: string;
    desc: string;
}

/**
 * fully compatibile with dsc.Message
 */
export interface CommandInput {
    member: dsc.GuildMember,
    author: dsc.User,
    guild: dsc.Guild,
    channelId: string,
    /** legacy commands only */
    reference?: dsc.MessageReference,
    channel: dsc.TextBasedChannel,
    reply: (options: string | dsc.MessagePayload | dsc.MessageReplyOptions) => Promise<dsc.OmitPartialGroupDMChannel<dsc.Message<boolean>>>,
    client: dsc.Client,
    mentions: dsc.MessageMentions,
    [additional_fields: string | number | symbol]: any
}

export interface Command {
    /* Command name */
    name: string;
    /* Long command description */
    longDesc: string;
    /* Short description */
    shortDesc: string;
    /* Expected arguments for the command */
    expectedArgs: CommandArgDef[];
    /* List of command aliases */
    aliases: string[];

    /* Array of role IDs that can execute the command. */
    allowedRoles: string[] | null;
    /* Array of user IDs that can execute the command. Everyone if null */
    allowedUsers: null | string[];

    /* Function that executes the command */
    //execute: (msg: dsc.OmitPartialGroupDMChannel<dsc.Message<boolean>>, args: string[], commands: Command[]) => void;
    execute: (inp: CommandInput, args: string[], commands: Map<Category, Command[]>) => void | any;
}