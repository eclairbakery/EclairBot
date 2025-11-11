import sleep from '@/util/sleep.js';

import actionsManager, { Action, MessageEventCtx, PredefinedActionEventTypes, PredefinedActionConstraints, PredefinedActionCallbacks } from '../index.js';
export default actionsManager;

import * as dsc from 'discord.js';

import { cfg } from '@/bot/cfg.js';
import fmtEmoji from '@/util/fmtEmoji.js';

export const countingChannelAction: Action<MessageEventCtx> = {
    activationEventType: PredefinedActionEventTypes.OnMessageCreateOrEdit,
    constraints: [
        (msg: dsc.Message) => {
            if (msg.author.bot) return false;
            if (msg.channelId !== cfg.features.forFun.countingChannel) return false;
            return true;
        }
    ],
    callbacks: [
        async (msg: dsc.Message) => {
            const number = parseInt(msg.content.trim());
            if (isNaN(number)) {
                const reply = await msg.reply(`to nie do tego kanał ${fmtEmoji(cfg.emoji.wowEmoji)}`);
                await sleep(1000);
                await msg.delete();
                await reply.delete();
                return;
            }

            const messages = await msg.channel.messages.fetch({ limit: 2 });
            const lastMsg = messages.filter(m => m.id !== msg.id).first();

            let lastNumber = 0;
            if (lastMsg) {
                const parsed = parseInt(lastMsg.content.trim());
                if (!isNaN(parsed)) {
                    lastNumber = parsed;
                }
            }

            if (number === lastNumber + 1) {
                return;
            } else {
                const reply = await msg.reply(`pomyliłeś się ${fmtEmoji(cfg.emoji.sadEmoji)}`);
                await sleep(1000);
                await msg.delete();
                await reply.delete();
                return;
            }
        }
    ]
};
