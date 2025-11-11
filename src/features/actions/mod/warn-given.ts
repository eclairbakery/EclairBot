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
            ctx.user.client.channels.fetch(cfg.features.logs.channel).then(channel => {
                if (channel && channel.isSendable()) {
                    channel.send({
                        embeds: [
                            new dsc.EmbedBuilder()
                                .setAuthor({ name: 'EclairBOT' })
                                .setColor(PredefinedColors.Orange)
                                .setTitle('Użytkownik dostał warna')
                                .setDescription(`Użytkownik <@${ctx.user.id}> dostał warna w wysokości ${ctx.points} pkt od ${ctx.moderator ? `moderatora <@${ctx.moderator}>` : 'nieznanego moderatora'}.`)
                                .addFields({ name: 'Powód', value: ctx.reason })
                        ]
                    });
                }
            }).catch(() => {});

            ctx.user.client.channels.fetch(cfg.channels.mod.warnings).then(channel => {
                if (channel && channel.isSendable()) {
                    channel.send({
                        embeds: [
                            new dsc.EmbedBuilder()
                                .setAuthor({ name: 'EclairBOT' })
                                .setColor(PredefinedColors.Orange)
                                .setTitle('Użytkownik dostał warna')
                                .setDescription(`Użytkownik <@${ctx.user.id}> dostał warna w wysokości ${ctx.points} pkt od ${ctx.moderator ? `moderatora <@${ctx.moderator}>` : 'nieznanego moderatora'}.`)
                                .addFields({ name: 'Powód', value: ctx.reason })
                        ]
                    });
                }
            }).catch(() => {});
        }
    ]
};