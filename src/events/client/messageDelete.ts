import { sendLog } from "@/bot/apis/log/send-log.js";
import { cfg } from "@/bot/cfg.js";
import { PredefinedColors } from "@/util/color.js";
import * as dsc from 'discord.js';

export function registerMsgDeleteDscEvents(client: dsc.Client) {
    client.on('messageDelete', async (msg) => {
        sendLog({
            title: 'W internecie nic nie ginie!',
            description: `Wiadomość https://discord.com/channels/${msg.guildId??'unknown'}/${msg.channelId??'unknown'}/${msg.id??'unknown'}, użytkownika <@${msg.author?.id}> została właśnie usunięta!`,
            color: PredefinedColors.Red,
            fields: [
                {
                    name: 'Treść',
                    value: msg.content?.slice(0, 1020) ?? '*brak treści*'
                }
            ]
        });
    });
}