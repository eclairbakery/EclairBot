import { addExperiencePoints } from '@/bot/level.ts';
import { Action, MessageEventCtx, PredefinedActionEventTypes } from '@/features/actions/index.ts';
import { PredefinedColors } from '@/util/color.ts';
import { mkMessageReferenceEmbed } from '@/bot/templates/messageReference.ts';

export const basicMsgCreateActions: Action<MessageEventCtx> = {
    constraints: [() => true],
    activationEventType: PredefinedActionEventTypes.OnMessageCreate,
    callbacks: [
        async (msg) => {
            if (!msg.inGuild()) return;

            // now goes leveling
            if (!msg.author.bot) await addExperiencePoints(msg);

            // easter egg
            if (msg.content.trim().toLowerCase() == 'eb') {
                msg.channel.send('https://i.iplsc.com/000AA4EQC5P4FTX6-C0.jpeg');
            }

            // quote bot
            await (async function () {
                if (msg.author.bot) return;

                const regex = /https?:\/\/(?:canary\.|ptb\.)?discord(?:app)?\.com\/channels\/(\d+)\/(\d+)\/(\d+)/;
                const match = msg.content.match(regex);
                if (!match) return;
                const [, , channelId, messageId] = match;

                await msg.reply({ embeds: [ await mkMessageReferenceEmbed(channelId, messageId, PredefinedColors.Fuchsia) ] });
            })();
        },
    ],
};
