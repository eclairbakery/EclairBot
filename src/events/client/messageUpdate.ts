import { sendLog } from "@/bot/apis/log/send-log.js";
import { cfg } from "@/bot/cfg.js";
import { PredefinedColors } from "@/util/color.js";
import * as dsc from 'discord.js';

export function registerMsgEditDscEvents(client: dsc.Client) {
    client.on('messageUpdate', async (oldMsg, msg) => {
        if (oldMsg.content?.trim() == msg.content?.trim()) {
            return;
        }

        sendLog({
            title: 'Edycja wiadomości',
            description: `Tu masz autora co nie: <@${msg.author.id}>\nA tu masz link co nie: https://discord.com/channels/${msg.guildId??'unknown'}/${msg.channelId??'unknown'}/${msg.id??'unknown'}`,
            color: PredefinedColors.Blue,
            fields: [
                {
                    name: 'Stara wiadomość',
                    value: oldMsg.content?.slice(0, 1020) ?? '*brak treści*'
                },
                {
                    name: 'Nowa wiadomość',
                    value: msg.content?.slice(0, 1020) ?? '*brak treści*'
                }
            ]
        });
    });
}