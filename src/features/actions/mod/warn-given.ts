import { sendLog } from "@/bot/apis/log/send-log.ts";

import { cfg } from "@/bot/cfg.ts";
import { OnWarnGiven, WarnEventCtx } from "@/events/actions/warnEvents.ts";
import { Action } from "@/features/actions/index.ts";
import { PredefinedColors } from "@/util/color.ts";

export const warnGivenLogAction: Action<WarnEventCtx> = {
    activationEventType: OnWarnGiven,
    constraints: [() => true],
    callbacks: [
        async (ctx) => {
            // logging
            sendLog({
                title: "Użytkownik dostał warna",
                color: PredefinedColors.Orange,
                description: `Użytkownik <@${ctx.user.id}> dostał warna w wysokości ${ctx.points} pkt od ${ctx.moderator ? `moderatora <@${ctx.moderator}>` : "nieznanego moderatora"}.`,
                fields: [
                    {
                        name: "Powód",
                        value: ctx.reason,
                    },
                    {
                        name: "Wygasa",
                        value: ctx.expiresAt ? `<t:${ctx.expiresAt?.toString()}:R>` : "nigdy",
                    },
                ],
            }, [cfg.channels.mod.warnings]);
        },
    ],
};
