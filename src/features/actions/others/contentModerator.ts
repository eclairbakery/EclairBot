import { Action, MessageEventCtx, PredefinedActionEventTypes } from '@/features/actions/index.ts';
import { cfg } from '@/bot/cfg.ts';
import sleep from '@/util/sleep.ts';
import { replyWarn } from '@/util/log.ts';

export const filesContentModerator: Action<MessageEventCtx> = {
    activationEventType: PredefinedActionEventTypes.OnMessageCreate,

    constraints: [
        (ctx) => ctx.author.id != ctx.client.user.id,
        (ctx) => ctx.channel.isThread() && ctx.channel.parent?.id == cfg.channels.other.files,
        (ctx) => ctx.channelId !== cfg.channels.other.files // safeguard
    ],
    callbacks: [
        async (msg) => {
            if (msg.attachments.size <= 0) return;

            const reply = await replyWarn(msg, 'Usunę ci tego posta', 'Musisz plik wysłać...');
            await sleep(5000);

            await reply.delete();
            await msg.delete();
            await msg.channel.delete();
        }
    ]
};
