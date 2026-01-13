import { cfg } from "@/bot/cfg.js";
import { Action, MessageEventCtx, Ok, PredefinedActionEventTypes, Skip } from "../index.js";

const substanceRegex = new RegExp(
    "\\b(" +
    "snus(y|a|em|ik|iki|ow)?|" +
    "white\\s?fox|" +
    "velo|" +
    "siberia|" +
    "epok|" +
    "nikotyn(a|owy|ie)?|" +
    "papieros(y|a|ow)?|" +
    "e-?papieros(y)?|" +
    "vape(y|m|owac)?|" +
    "joint(y|a)?|" +
    "ziol(o|a)?|" +
    "traw(a|y|a)?|" +
    "alkohol|" +
    "piw(o|a|em)?|" +
    "wod(k|ka|ki|a)?" +
    ")\\b",
    "i"
);

function mentionsSubstances(content: string): boolean {
    return substanceRegex.test(
        content
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
    );
}

export const filterGeneralAction: Action<MessageEventCtx> = {
    activationEventType: PredefinedActionEventTypes.OnMessageCreateOrEdit,
    constraints: [
        (msg) => {
            return msg.member!.roles.cache.has('1460741066050506852') ? Skip : Ok;
        },
        (msg) => {
            return msg.channelId == cfg.channels.general.general;
        },
        (msg) => {
            return mentionsSubstances(msg.content);
        }
    ],
    callbacks: [
        async (msg) => {
            await msg.delete();
            await msg.member!.roles.add('1460741066050506852');
            let msg2;
            if (msg.channel.isSendable()) {
                msg2 = await msg.channel.send(`witam <@${msg.author.id}>, dostałeś tempmute na general za tematykę rozmów, jest to serwer o technologii, nie o snusach/alkoholu/używkach. na przyszłość pisz o tym na <#${cfg.channels.general.offtopic}>\n\nza dwie minuty masz unmute`);
            } else {
                return;
            }
            setTimeout(() => {
                msg.member!.roles.remove('1460741066050506852');
                msg2.delete();
            }, 2 * 60 * 1000);
        }
    ]
};