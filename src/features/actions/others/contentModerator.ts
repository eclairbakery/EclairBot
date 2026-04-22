import { Action, MessageEventCtx, PredefinedActionEventTypes } from '@/features/actions/index.ts';
import { cfg } from '@/bot/cfg.ts';
import sleep from '@/util/sleep.ts';
import { replyWarn } from '@/util/log.ts';

export const filesContentModerator: Action<MessageEventCtx> = {
    activationEventType: PredefinedActionEventTypes.OnMessageCreate,

    constraints: [
        (ctx) => ctx.author.id != ctx.client.user.id,
        (ctx) => ctx.channel.isThread() && ctx.channel.parentId == cfg.channels.other.files,
        (ctx) => ctx.attachments.size == 0,
        (ctx) => ctx.channelId == ctx.id
    ],
    callbacks: [
        async (msg) => {
            const reply = await replyWarn(msg, 'Usunę ci tego posta', 'Musisz plik wysłać. Może się tego nie domyśliłeś, ale tu pliczki się wysyła.');
            await sleep(5000);

            await reply.delete();
            await msg.delete();
            await msg.channel.delete();
        }
    ]
};
