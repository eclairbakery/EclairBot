import * as dsc from "discord.js";
import { LogData } from "./log-defs.js";
import { cfg } from "@/bot/cfg.js";
import { PredefinedColors } from "@/util/color.js";
import { client } from "@/client.js";
import { t } from "../translations/translate.js";

export async function sendLog(logData: LogData, additionalChannels: dsc.Snowflake[] = []) {
    let where = logData.where ?? cfg.features.logs.channel;
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
                new dsc.EmbedBuilder()
                    .setTitle(t(header))
                    .setDescription(t(description))
                    .setColor(color)
                    .setFields(fields)
                    .setAuthor({
                        name: 'EclairBOT'
                    })
            ]
        });
    }
}