import { sendLog } from "@/bot/apis/log/send-log.ts";
import { cfg } from "@/bot/cfg.ts";
import { PredefinedColors } from "@/util/color.ts";
import * as dsc from 'discord.js';

export function registerChannelDeleteDscEvents(client: dsc.Client) {
    client.on('channelDelete', async (chan) => {
        sendLog({
            title: 'Usunięto kawał historii piekarnii!',
            description: `Kanał <#${chan.id}> został usunięty! Niestety nie mam zielonego pojęcia co to za kanał.`,
            color: PredefinedColors.Red
        });
    });
}