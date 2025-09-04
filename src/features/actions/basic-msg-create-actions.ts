import { cfg } from "../../bot/cfg.js";
import { addExperiencePoints } from "../../bot/level.js";
import { client } from "../../client.js";
import { Action, MessageEventCtx, PredefinedActionEventTypes } from "../actions.js";

export const basicMsgCreateActions: Action<MessageEventCtx> = {
    constraints: [() => true],
    activationEventType: PredefinedActionEventTypes.OnMessageCreate,
    callbacks: [async (msg) => {
        // block dm's, if you want to dm me, fuck out
        if (msg.inGuild()) {
            // now goes leveling
            if (!msg.author.bot) await addExperiencePoints(msg);

            // easter egg
            if (msg.content === 'obserwuję was' && msg.author.id == '1409902422108934226') {
                return msg.reply('ja cb też');
            } else if (msg.author.id == '1409902422108934226' && (await msg.fetchReference()).author.id == client.user.id) {
                return msg.reply('jestem istotą wyższą a jeśli to kwestionujesz lub sądzisz że wyższy jesteś to kłamiesz');
            } else if (msg.content === 'siema' && msg.author.id == '1409902422108934226') {
                return msg.reply('siema watchdog, pogódźmy się\n-# (jak znowu zaczniesz mieć do mnie problemy to skończy się anti-spamem, uważaj podwładny)');
            }

            // gifs ban
            if (msg.member!.roles.cache.has(cfg.unfilteredRelated.gifBan) && msg.channelId !== cfg.unfilteredRelated.unfilteredChannel && (msg.attachments.some(att => att.name?.toLowerCase().endsWith('.gif')) || msg.content.includes('tenor.com') || msg.content.includes('.gif'))) {
                await msg.reply('masz bana na gify');
                await msg.delete();
                return;
            }

            // neocity warn
            if (cfg.unfilteredRelated.makeNeocities.includes(msg.author.id) && !msg.content.startsWith(cfg.general.prefix) && Math.random() < 0.01) {
                await msg.reply('https://youcantsitwithus.neocities.org');
                return;
            }
        } else {
            if (msg.author.id == '990959984005222410' && msg.content.startsWith('send ')) {
                const args = msg.content.replace('send ', '').split(' ');
                const userid = args.shift();
                (await client.users.fetch(userid)).send(args.join(' '));
                msg.reply('ok wysłałem');
                return;
            }
        }
    }]
};