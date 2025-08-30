import sleep from '../../util/sleep.js';

import actionsManager, { Action, PredefinedActionEventTypes, PredefinedActionConstraints, PredefinedActionCallbacks, MessageEventCtx } from '../actions.js';
export default actionsManager;

import * as dsc from 'discord.js';

import { cfg } from '../../bot/cfg.js';

export const lastLetterChannelAction: Action<MessageEventCtx> = {
    activationEventType: PredefinedActionEventTypes.OnMessageCreateOrEdit,
    constraints: [
        (msg: dsc.Message) => {
            if (msg.author.bot) return false;
            if (msg.channelId !== cfg.general.forFun.lastLetterChannel) return false;
            return true;
        }
    ],
    callbacks: [
        async (msg: dsc.Message) => {
            const word = msg.content.trim();
            if (word.length < 1) {
                const reply = await msg.reply(`to nie do tego kanał <:joe_wow:1308174905489100820>`);
                await sleep(1000);
                await msg.delete();
                await reply.delete();
                return;
            }

            const messages = await msg.channel.messages.fetch({ limit: 2 });
            const lastMsg = messages.filter(m => m.id !== msg.id).first();

            if (lastMsg) {
                const lastWord = lastMsg.content.trim();
                if (lastWord.length > 0) {
                    const expectedFirst = lastWord[lastWord.length - 1].toLowerCase();
                    const actualFirst = word[0].toLowerCase();

                    if (expectedFirst !== actualFirst) {
                        const reply = await msg.reply(`pomyliłeś się <:joe_smutny:1317904814025474088>`);
                        await sleep(1000);
                        await msg.delete();
                        await reply.delete();
                        return;
                    }
                }
            }
            if (msg.content.endsWith('ą')) {
                const reply = await msg.reply(`no ej no przeczytałeś kanał opis? <:joe_zatrzymanie_akcji_serca:1308174897758994443>`);
                await sleep(1000);
                await msg.delete();
                await reply.delete();
                return;
            }
        }
    ]
    };