import sleep from "@/util/sleep.ts";

import actionsManager, { Action, MessageEventCtx, PredefinedActionEventTypes } from "../index.ts";
export default actionsManager;

import * as dsc from "discord.js";

import { cfg } from "@/bot/cfg.ts";
import fmtEmoji from "@/util/fmtEmoji.ts";

export const lastLetterChannelAction: Action<MessageEventCtx> = {
    activationEventType: PredefinedActionEventTypes.OnMessageCreateOrEdit,
    constraints: [
        (msg: dsc.Message) => {
            if (msg.author.bot) return false;
            if (msg.channelId !== cfg.features.forFun.lastLetterChannel) return false;
            return true;
        },
    ],
    callbacks: [
        async (msg: dsc.Message) => {
            const word = msg.content.trim();
            if (word.length < 1) {
                const reply = await msg.reply(`to nie do tego kanał ${fmtEmoji(cfg.emojis.wowEmoji)}`);
                await sleep(1000);
                await msg.delete();
                await reply.delete();
                return;
            }

            const messages = await msg.channel.messages.fetch({ limit: 2 });
            const lastMsg = messages.filter((m) => m.id !== msg.id).first();

            if (lastMsg) {
                const lastWord = lastMsg.content.trim();
                if (lastWord.length > 0) {
                    const expectedFirst = lastWord[lastWord.length - 1].toLowerCase();
                    const actualFirst = word[0].toLowerCase();

                    if (expectedFirst !== actualFirst) {
                        const reply = await msg.reply(`pomyliłeś się ${fmtEmoji(cfg.emojis.sadEmoji)}`);
                        await sleep(1000);
                        await msg.delete();
                        await reply.delete();
                        return;
                    }
                }
            }
            if (msg.content.endsWith("ą")) {
                const reply = await msg.reply(`no ej no przeczytałeś kanał opis? ${fmtEmoji(cfg.emojis.heartAttackEmoji)}`);
                await sleep(1000);
                await msg.delete();
                await reply.delete();
                return;
            }
        },
    ],
};
