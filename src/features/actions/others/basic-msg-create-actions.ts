import { addExperiencePoints } from '@/bot/level.ts';
import { type Action, type MessageEventCtx, PredefinedActionEventTypes } from '@/features/actions/index.ts';
import { PredefinedColors } from '@/util/color.ts';
import { mkMessageReferenceEmbed } from '@/bot/templates/message-reference.ts';
import { starRepository } from '@/bot/apis/github/github.ts';
import logError from '@/util/log-error.ts';

export const basicMsgCreateActions: Action<MessageEventCtx> = {
    name: 'others/basic-msg-create-actions',
    constraints: [() => true],
    activatesOn: PredefinedActionEventTypes.OnMessageCreate,
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

                await msg.reply({ embeds: [await mkMessageReferenceEmbed(channelId, messageId, PredefinedColors.Fuchsia)] });
            })();

            await (async function () {
                const regex = /https?:\/\/(?:www\.)?github\.com\/([^\/\s]+)\/([^\/\s]+)/i;
                const match = msg.content.match(regex);
                if (!match) return;

                let [, owner, repo] = match;

                repo = repo.replace(/\.git$/, '').split('?')[0];

                try {
                    const givenStar = await starRepository(owner, repo);
                    if (givenStar) await msg.reply(`dałem stara na ${owner}/${repo} btw`);
                } catch (e) {
                    logError('stdwarn', e, 'GitHub repo starring service');
                }
            })();
        },
    ],
};
