import { MessageEventCtx, PredefinedActionEventTypes } from '../index.ts';

import { executeAsk } from '@/features/ei/ask.ts';

import { Action } from '../index.ts';
import { client } from '@/client.ts';
import { cfg } from '@/bot/cfg.ts';

import { MessageType } from 'discord.js';

export const askAction: Action<MessageEventCtx> = {
    activationEventType: [PredefinedActionEventTypes.OnMessageCreate],

    constraints: [
        (ctx) => ctx.author.id != client.user?.id,
        async (ctx) => {
            const referenced = (typeof ctx.reference?.messageId == 'string'
                ? await ctx.fetchReference()
                : false);

            return ctx.channelId == cfg.channels.general.ei ||
                    ctx.content.trim().startsWith(`<@${client.user?.id}>`) ||
                    (referenced ? (
                        referenced.author.id == client.user?.id &&
                        ctx.type == MessageType.Reply &&
                        referenced.embeds.length <= 0
                    ) : false)
        },
        (ctx) =>
            !ctx.content.trim().startsWith('\\') &&
            !ctx.content.trim().startsWith('eb-ignore '),
    ],

    callbacks: [
        (msg) => {
            const question =
                msg.content.trim().startsWith(`<@${client.user!.id}>`) 
                    ? msg.content.trim().replace(`<@${client.user!.id}>`, '') 
                    : msg.content;
            return executeAsk(msg, question, cfg.features.ai.contextDefaultMessages);
        },
    ],
};
