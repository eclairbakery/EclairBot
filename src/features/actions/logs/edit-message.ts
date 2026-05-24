import * as dsc from 'discord.js';
import { cfg } from '@/bot/cfg.ts';
import { mkMessageReferenceEmbed } from '@/bot/templates/message-reference.ts';
import { PredefinedColors } from '@/util/color.ts';

export function registerMsgEditDscEvents(client: dsc.Client) {
    client.on('messageUpdate', async (oldMsg, msg) => {
        if (oldMsg.content?.trim() == msg.content?.trim()) return;
        if (oldMsg.partial) return;

        const logs_channel = await msg.client.channels.fetch(cfg.channels.mod.logs) as dsc.GuildTextBasedChannel;   
        logs_channel.send({ embeds: [
            await mkMessageReferenceEmbed(oldMsg, {
                color: PredefinedColors.Blue,
                title: "Edycja wiadomości: stara wiadomość"
            }),
            await mkMessageReferenceEmbed(msg, {
                color: PredefinedColors.Blue,
                title: "Nowa wiadomość"
            })
        ] });
    });
}
