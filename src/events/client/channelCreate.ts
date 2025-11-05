import { cfg } from "@/bot/cfg.js";
import { PredefinedColors } from "@/util/color.js";
import * as dsc from 'discord.js';

export function registerChannelCreateDscEvents(client: dsc.Client) {
    client.on('channelCreate', async (chan) => {
        const channel = await client.channels.fetch(cfg.logs.channel);
        if (!channel?.isSendable()) return;
        channel.send({
            embeds: [
                new dsc.EmbedBuilder()
                    .setAuthor({
                        name: 'EclairBOT'
                    })
                    .setColor(PredefinedColors.Yellow)
                    .setTitle('Nowy kanał na piekarnii!')
                    .setDescription(`Powstał kanał <#${chan.id}> na naszym serwerze!`)
            ]
        });
    });
}