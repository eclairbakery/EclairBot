import sleep from '@/util/sleep.ts';

import actionsManager, { Action, MagicSkipAllActions, MessageEventCtx, PredefinedActionEventTypes } from '../index.ts';
export default actionsManager;

import * as dsc from 'discord.js';

import { cfg } from '@/bot/cfg.ts';
import fmtEmoji from '@/util/fmt-emoji.ts';

export const countingChannelAction: Action<MessageEventCtx> = {
    name: '4fun/counting',
    activatesOn: PredefinedActionEventTypes.OnMessageCreateOrEdit,
    constraints: [
        (msg: dsc.Message) => {
            if (msg.author.bot) return false;
            if (msg.channelId !== cfg.features.forFun.countingChannel) return false;
            return true;
        },
    ],
    callbacks: [
        async (msg: dsc.Message) => {
            const number = parseInt(msg.content.trim());
            if (isNaN(number)) {
                const reply = await msg.reply(`to nie do tego kanał ${fmtEmoji(cfg.emojis.wowEmoji)}`);
                await sleep(1000);
                await msg.delete();
                await reply.delete();
                return MagicSkipAllActions;
            }

            const messages = await msg.channel.messages.fetch({ limit: 50 });
            const lastMsg = messages.filter((m) => m.id !== msg.id && !isNaN(parseInt(m.content))).first();

            let lastNumber = 0;
            if (lastMsg) {
                const parsed = parseInt(lastMsg.content.trim());
                if (!isNaN(parsed)) {
                    lastNumber = parsed;
                }
            }

            if (number === lastNumber + 1) {
                return MagicSkipAllActions;
            } else {
                const reply = await msg.reply(`pomyliłeś się ${fmtEmoji(cfg.emojis.sadEmoji)}`);
                await sleep(1000);
                await msg.delete();
                await reply.delete();
                return MagicSkipAllActions;
            }
        },
    ],
};
