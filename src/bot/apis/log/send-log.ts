import * as dsc from "discord.js";
import { LogData } from "./log-defs.ts";
import { cfg } from "@/bot/cfg.ts";
import { PredefinedColors } from "@/util/color.ts";
import { client } from "@/client.ts";
import { ReplyEmbed } from "../translations/reply-embed.ts";

export async function sendLog(logData: LogData, additionalChannels: dsc.Snowflake[] = []) {
    let where = logData.where ?? cfg.channels.mod.logs;
    let color = logData.color ?? PredefinedColors.Grey;
    let header = logData.title;
    let description = logData.description;
    let fields = logData.fields ?? [];

    let channels: dsc.Channel[] = [ (await client.channels.fetch(where))! ];
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
                        name: 'EclairBOT'
                    })
            ]
        });
    }
}
