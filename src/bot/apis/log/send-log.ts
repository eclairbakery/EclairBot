import * as dsc from 'discord.js';
import { LogData } from './log-defs.ts';
import { cfg } from '@/bot/cfg.ts';
import { PredefinedColors } from '@/util/color.ts';
import { client } from '@/client.ts';
import { ReplyEmbed } from '../translations/reply-embed.ts';

export async function sendLog(logData: LogData, additionalChannels: dsc.Snowflake[] = []) {
    const where = logData.where ?? cfg.channels.mod.logs;
    const color = logData.color ?? PredefinedColors.Grey;
    const header = logData.title;
    const description = logData.description;
    const fields = logData.fields ?? [];

    const channels: dsc.Channel[] = [(await client.channels.fetch(where))!];
    for (const chan of additionalChannels) {
        channels.push((await client.channels.fetch(chan))!);
    }

    for (const channel of channels) {
        if (!channel || !channel.isSendable()) continue;
        await channel.send({
            embeds: [
                new ReplyEmbed()
                    .setTitle(header)
                    .setDescription(description)
                    .setColor(color)
                    .setFields(fields)
                    .setAuthor({
                        name: 'EclairBOT',
                    }),
            ],
        });
        if ((logData.attachments ?? []).length != 0) await channel.send({
            files: logData.attachments,
        })
    }
}
