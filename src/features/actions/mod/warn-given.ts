import { db } from "@/bot/apis/db/bot-db.js";
import { sendLog } from "@/bot/apis/log/send-log.js";
import ban from "@/bot/apis/mod/bans.js";
import kick from "@/bot/apis/mod/kicks.js";
import mute from "@/bot/apis/mod/muting.js";
import { cfg } from "@/bot/cfg.js";
import { client } from "@/client.js";
import { OnWarnGiven, WarnEventCtx } from "@/events/actions/warnEvents.js";
import { Action } from "@/features/actions/index.js";
import { PredefinedColors } from "@/util/color.js";
import { Hour } from "@/util/parseTimestamp.js";
import * as dsc from 'discord.js';

export const warnGivenLogAction: Action<WarnEventCtx> = {
    activationEventType: OnWarnGiven,
    constraints: [() => true],
    callbacks: [
        async (ctx) => {
            // logging
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

            // auto actions
            const result = await db.selectOne("SELECT SUM(points) AS totalPoints FROM warns WHERE user_id = ?", [ctx.user.id]);
            const points = result?.totalPoints ?? 0;
            const prevPoints = points - ctx.points;
            const autoActions = cfg.features.moderation.warnAutoActions;
            const triggeredActions = autoActions.filter(a =>
                prevPoints < a.activationPointsNumber &&
                points >= a.activationPointsNumber
            );
            const member = await client.guilds.cache.first()!.members.fetch(ctx.user.id);

            for (const action of triggeredActions) {
                if (action.type === "mute") {
                    await mute(member, { duration: action.duration ?? 24 * Hour, reason: action.reason });
                } else if (action.type === "kick") {
                    await kick(member, {reason: action.reason, mod: client.user!.id});
                } else if (action.type === "ban") {
                    await ban(member, {reason: action.reason, mod: client.user!.id});
                }
            }
        }
    ]
};