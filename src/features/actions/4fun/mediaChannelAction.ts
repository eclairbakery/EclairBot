import sleep from '@/util/sleep.ts';

import actionsManager, { Action, MagicSkipAllActions, MessageEventCtx, PredefinedActionEventTypes } from '../index.ts';
export default actionsManager;

import * as dsc from 'discord.js';

import { cfg } from '@/bot/cfg.ts';
import fmtEmoji from '@/util/fmtEmoji.ts';

export const mediaChannelAction: Action<MessageEventCtx> = {
    activationEventType: PredefinedActionEventTypes.OnMessageCreate,
    constraints: [
        (msg: dsc.Message) => {
            if (msg.author.bot) return false;
            const channel = cfg.features.forFun.media.find((mc) => mc.channel == msg.channelId);
            if (channel == null || channel == undefined) return false;
            return true;
        },
    ],
    callbacks: [
        async (msg: dsc.Message) => {
            const channelConfig = cfg.features.forFun.media.find((mc) => mc.channel == msg.channelId)!;
            let check = false;
            if (msg.attachments.size > 0) {
                for (const attachment of msg.attachments.values()) {
                    if (attachment.contentType?.startsWith('image/')) {
                        check = true;
                    } else if (attachment.contentType?.startsWith('video/')) {
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
                        reason: 'Tutaj się pisze odpowiedzi czy coś.',
                    });
                }
                for (const reaction of channelConfig.addReactions) {
                    await msg.react(reaction);
                }
                return MagicSkipAllActions;
            } else if (channelConfig.deleteMessageIfNotMedia) {
                const reply = await msg.reply(`to nie do tego kanał ${fmtEmoji(cfg.emojis.wowEmoji)}`);
                await sleep(2000);
                await msg.delete();
                await reply.delete();
                return MagicSkipAllActions;
            }
        },
    ],
};
