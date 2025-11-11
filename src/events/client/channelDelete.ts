import { cfg } from "@/bot/cfg.js";
import { PredefinedColors } from "@/util/color.js";
import * as dsc from 'discord.js';

export function registerChannelDeleteDscEvents(client: dsc.Client) {
    client.on('channelDelete', async (chan) => {
        const channel = await client.channels.fetch(cfg.features.logs.channel);
        if (!channel?.isSendable()) return;
        channel.send({
            embeds: [
                new dsc.EmbedBuilder()
                    .setAuthor({
                        name: 'EclairBOT'
                    })
                    .setColor(PredefinedColors.Red)
                    .setTitle('Usunięto kawał historii piekarnii!')
                    .setDescription(`Kanał <#${chan.id}> został usunięty! Niestety nie mam zielonego pojęcia co to za kanał.`)
            ]
        });
    });
}