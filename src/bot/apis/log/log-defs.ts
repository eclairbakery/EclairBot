import * as dsc from 'discord.js';

import { PredefinedColors, RarelyUsedColors } from '@/util/color.ts';

export interface LogData {
    title: string;
    description: string;
    attachments?: (dsc.Attachment | dsc.AttachmentBuilder)[];
    fields?: dsc.APIEmbedField[];
    color?: PredefinedColors | RarelyUsedColors;
    where?: dsc.Snowflake;
}
