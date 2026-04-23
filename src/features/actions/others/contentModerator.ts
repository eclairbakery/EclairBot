import { type Action, type MessageEventCtx, PredefinedActionEventTypes } from '@/features/actions/index.ts';
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

export const communityPollsContentModerator: Action<MessageEventCtx> = {
    activationEventType: PredefinedActionEventTypes.OnMessageCreate,

    constraints: [
        (ctx) => ctx.author.id != ctx.client.user.id,
        (ctx) => !ctx.channel.isThread(),
        (ctx) => ctx.channel.id == cfg.channels.other.communityPolls
    ],
    callbacks: [
        async (msg) => {
            if (!msg.poll) {
                return replyWarn(msg, 'To nie do tego kanał', 'W skrócie no to na kanale, który się nazywa "ankiety społeczności" wysyła się te Discordowe ankiety.');
            }

            await msg.reply('<@1320034068322324660>');
            
            const threadNames = ["Kanał commentary na YT", "Odpowiedzi", "Komentarze", "Merytoryczne dyskusje na temat ankiety"];
            const thread = await msg.startThread({
                name: threadNames[Math.floor(Math.random() * threadNames.length)],
            });
            await thread.send('tu możecie odpowiedzi merytoryczne wysyłać');
        }
    ]
};
