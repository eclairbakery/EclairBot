import { addExperiencePoints } from '@/bot/level.ts';
import { Action, MessageEventCtx, PredefinedActionEventTypes } from '@/features/actions/index.ts';
import { PredefinedColors } from '@/util/color.ts';
import { GuildTextBasedChannel, PermissionsBitField } from 'discord.js';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.ts';

import * as log from '@/util/log.ts';

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

                const perms = (channel as GuildTextBasedChannel).permissionsFor(msg.author);
                if (
                    !perms?.has(PermissionsBitField.Flags.ViewChannel) ||
                    !perms?.has(PermissionsBitField.Flags.ReadMessageHistory)
                ) {
                    return log.replyInfo(msg, 'Co ty odsigmiasz bratku?', 'Nie cytuj wiadomości których nawet nie możesz zobaczyć...');
                }

                const excludedChannels = ['1235641912241819669'];
                const strictlyExcludedChannels = ['1290327060970995812'];
                const excludedCategories = ['1235552673978388560', '1419322858659905566', '1407377025437798442'];

                if (strictlyExcludedChannels.includes(channel.id)) {
                    return log.replyWarn(
                        msg,
                        'Ten kanał jest zablokowany!',
                        'Jest on na liście kanałów ściśle zablokowanych, więc nie możesz z tamtąd niczego zleakować everyone... so sad, so sad...',
                    );
                } else if (excludedChannels.includes(channel.id) && !msg.content.includes('--no-block-excluded-channels')) {
                    return log.replyInfo(
                        msg,
                        'Ten kanał jest zablokowany!',
                        'Z racji iż miły jestem czy coś i masz permisje do kanału, to możesz ponowić quote z `--no-block-excluded-channels`.',
                    );
                } else if (channel.parentId && excludedCategories.includes(channel.parentId) && !msg.content.includes('--no-block-excluded-channels')) {
                    return log.replyInfo(
                        msg,
                        'Ten kanał jest w zablokowanej kategorii!',
                        'Z racji iż miły jestem czy coś i masz permisje do kanału, to możesz ponowić quote z `--no-block-excluded-channels`.',
                    );
                }

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
