import { MessageEventCtx, PredefinedActionEventTypes } from '../index.ts';

import { executeAsk } from '@/features/ei/ask.ts';

import { Action } from '../index.ts';
import { client } from '@/client.ts';
import { cfg } from '@/bot/cfg.ts';

export const askAction: Action<MessageEventCtx> = {
    activationEventType: [PredefinedActionEventTypes.OnMessageCreate],

    constraints: [
        (ctx) => ctx.author.id != client.user?.id,
        (ctx) =>
            ctx.channelId == cfg.channels.general.ei ||
            ctx.content.trim().startsWith(`<@${client.user?.id}>`),
        (ctx) =>
            !ctx.content.trim().startsWith('\\') &&
            !ctx.content.trim().startsWith('eb-ignore'),
    ],

    callbacks: [
        (msg) => {
            const question = msg.content.trim().startsWith(`<@${client.user!.id}>`) ? msg.content.trim().replace(`<@${client.user!.id}>`, '') : msg.content;
            return executeAsk(msg, question, cfg.features.ai.contextDefaultMessages);
        },
    ],
};
