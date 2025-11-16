import { sendLog } from "@/bot/apis/log/send-log.js";
import { cfg } from "@/bot/cfg.js";
import { PredefinedColors } from "@/util/color.js";
import * as dsc from 'discord.js';

export function registerChannelCreateDscEvents(client: dsc.Client) {
    client.on('channelCreate', async (chan) => {
        sendLog({
            title: 'Nowy kanał na piekarnii!',
            description: `Powstał kanał <#${chan.id}> na naszym serwerze!`,
            color: PredefinedColors.Yellow
        });
    });
}