import { sendLog } from "@/bot/apis/log/send-log.js";
import { cfg } from "@/bot/cfg.js";
import { OnWarnGiven, WarnEventCtx } from "@/events/actions/warnEvents.js";
import { Action } from "@/features/actions/index.js";
import { PredefinedColors } from "@/util/color.js";
import * as dsc from 'discord.js';

export const warnGivenLogAction: Action<WarnEventCtx> = {
    activationEventType: OnWarnGiven,
    constraints: [() => true],
    callbacks: [
        (ctx) => {
            sendLog({
                title: 'Użytkownik dostał warna',
                color: PredefinedColors.Orange,
                description: `Użytkownik <@${ctx.user.id}> dostał warna w wysokości ${ctx.points} pkt od ${ctx.moderator ? `moderatora <@${ctx.moderator}>` : 'nieznanego moderatora'}.`,
                fields: [
                    {
                        name: 'Powód',
                        value: ctx.reason
                    }
                ]
            }, [cfg.channels.mod.warnings]);
        }
    ]
};