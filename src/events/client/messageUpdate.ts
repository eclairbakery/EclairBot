import { cfg } from "@/bot/cfg.js";
import { PredefinedColors } from "@/util/color.js";
import * as dsc from 'discord.js';

export function registerMsgEditDscEvents(client: dsc.Client) {
    client.on('messageUpdate', async (oldMsg, msg) => {
        if (oldMsg.content?.trim() == msg.content?.trim()) {
            return;
        }

        const channel = await client.channels.fetch(cfg.features.logs.channel);
        if (!channel?.isSendable()) return;
        channel.send({
            embeds: [
                new dsc.EmbedBuilder()
                    .setAuthor({
                        name: 'EclairBOT'
                    })
                    .setColor(PredefinedColors.Blue)
                    .setTitle('Edycja wiadomości')
                    .setDescription(`Tu masz autora co nie: <@${msg.author.id}>\nA tu masz link co nie: https://discord.com/channels/${msg.guildId??'unknown'}/${msg.channelId??'unknown'}/${msg.id??'unknown'}`)
                    .setFields([
                        {
                            name: 'Stara wiadomość',
                            value: oldMsg.content?.slice(0, 1020) ?? '*brak treści*'
                        },
                        {
                            name: 'Nowa wiadomość',
                            value: msg.content?.slice(0, 1020) ?? '*brak treści*'
                        }
                    ])
            ]
        });
    });
}