import { cfg } from "@/bot/cfg.js";
import { PredefinedColors } from "@/util/color.js";
import * as dsc from 'discord.js';

export function registerMsgDeleteDscEvents(client: dsc.Client) {
    client.on('messageDelete', async (msg) => {
        const channel = await client.channels.fetch(cfg.features.logs.channel);
        if (!channel?.isSendable()) return;
        channel.send({
            embeds: [
                new dsc.EmbedBuilder()
                    .setAuthor({
                        name: 'EclairBOT'
                    })
                    .setColor(PredefinedColors.Red)
                    .setTitle('W internecie nic nie ginie!')
                    .setDescription(`wiadomość https://discord.com/channels/${msg.guildId??'unknown'}/${msg.channelId??'unknown'}/${msg.id??'unknown'}, użytkownika <@${msg.author?.id}> została właśnie usunięta!`)
                    .setFields([
                        {
                            name: 'Treść',
                            value: msg.content?.slice(0, 1020) ?? '*brak treści*'
                        }
                    ])
            ]
        });
    });
}