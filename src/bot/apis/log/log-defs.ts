import * as dsc from 'discord.js';

export interface LogData {
    title: string;
    description: string;
    attachments?: (dsc.Attachment | dsc.AttachmentBuilder)[];
    fields?: dsc.APIEmbedField[];
    color?: dsc.ColorResolvable;
    where?: dsc.Snowflake;
}
