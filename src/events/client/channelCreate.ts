import { sendLog } from "@/bot/apis/log/send-log.ts";
import { PredefinedColors } from "@/util/color.ts";
import * as dsc from "discord.js";

export function registerChannelCreateDscEvents(client: dsc.Client) {
    client.on("channelCreate", async (chan) => {
        sendLog({
            title: "Nowy kanał na piekarnii!",
            description: `Powstał kanał <#${chan.id}> na naszym serwerze!`,
            color: PredefinedColors.Yellow,
        });
    });
}
