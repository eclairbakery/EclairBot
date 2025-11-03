import sleep from '@/util/sleep.js';

import actionsManager, { Action, PredefinedActionEventTypes, PredefinedActionConstraints, PredefinedActionCallbacks, MessageEventCtx } from '../../actions.js';
export default actionsManager;

import * as dsc from 'discord.js';

import { cfg } from '@/bot/cfg.js';

export const mediaChannelAction: Action<MessageEventCtx> = {
    activationEventType: PredefinedActionEventTypes.OnMessageCreate,
    constraints: [
        (msg: dsc.Message) => {
            if (msg.author.bot) return false;
            const channel = cfg.general.forFun.media.find((mc) => mc.channel == msg.channelId);
            if (channel == null || channel == undefined) return false;
            return true;
        }
    ],
    callbacks: [
        async (msg: dsc.Message) => {
            const channelConfig = cfg.general.forFun.media.find((mc) => mc.channel == msg.channelId)!;
            let check = false;
            if (msg.attachments.size > 0) {
                for (const attachment of msg.attachments.values()) {
                    if (attachment.contentType?.startsWith("image/")) {
                        check = true;
                    } else if (attachment.contentType?.startsWith("video/")) {
                        check = true;
                    }
                }
            }
            if (/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]{11})(?:[?&](?:list|index|t)=[^&]*)*/.test(msg.content)) {
                check = true;
            }
            if (check) {
                if (channelConfig.shallCreateThread) {
                    await msg.startThread({
                        name: 'Odpowiedzi!',
                        reason: 'Tutaj się pisze odpowiedzi czy coś.'
                    });
                }
                for (const reaction of channelConfig.addReactions) {
                    await msg.react(reaction);
                }
            } else if (channelConfig.deleteMessageIfNotMedia) {
                const reply = await msg.reply('to nie do tego kanał <:joe_wow:1308174905489100820>');
                await sleep(2000);
                await msg.delete();
                await reply.delete();
                return;
            }
        }
    ]
}