import * as dsc from 'discord.js';

import { PredefinedColors } from '@/util/color.ts';

export interface LogData {
    title: string;
    description: string;
    attachments?: (dsc.Attachment | dsc.AttachmentBuilder)[];
    fields?: dsc.APIEmbedField[];
    color?: PredefinedColors;
    where?: dsc.Snowflake;
}
