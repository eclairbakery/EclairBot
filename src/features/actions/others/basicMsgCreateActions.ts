import { addExperiencePoints } from '@/bot/level.ts';
import { Action, MessageEventCtx, PredefinedActionEventTypes } from '@/features/actions/index.ts';
import { PredefinedColors } from '@/util/color.ts';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.ts';

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

                const channel = await msg.client.channels.fetch(channelId);
                if (!channel?.isTextBased()) return;
                if (channel.isDMBased()) return;
 
                const quotedMsg = await channel.messages.fetch(messageId);

                const embed = new ReplyEmbed()
                    .setAuthor({
                        name: quotedMsg.author.tag,
                        iconURL: quotedMsg.author.displayAvatarURL(),
                    })
                    .setDescription(quotedMsg.content || '*brak treści*')
                    .setTimestamp(quotedMsg.createdAt)
                    .setFooter({ text: `Wysłano w ${(channel as { name: string })?.name ?? 'piekarnii'}` })
                    .setColor(PredefinedColors.Fuchsia);

                if (quotedMsg.attachments.size > 0) {
                    const first = quotedMsg.attachments.first();
                    if (first?.contentType?.startsWith('image/')) {
                        embed.setImage(first.url);
                    } else {
                        embed.addFields({
                            name: 'Załączniki',
                            value: quotedMsg.attachments.map((a) => `[${a.name}](${a.url})`).join('\n'),
                        });
                    }
                }

                await msg.reply({ embeds: [embed] });
            })();
        },
    ],
};
