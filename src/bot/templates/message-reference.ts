import type { Snowflake } from '@/defs.ts';
import type { PredefinedColors } from '@/util/color.ts';
import type { GuildTextBasedChannel, HexColorString } from 'discord.js';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.ts';
import { client } from '@/client.ts';

export async function mkMessageReferenceEmbed(channelId: Snowflake, messageId: Snowflake, color: HexColorString | PredefinedColors) {
    const channel = await client.channels.fetch(channelId) as GuildTextBasedChannel;

    const quotedMsg = await channel.messages.fetch(messageId);
    const embed = new ReplyEmbed()
        .setAuthor({
            name: quotedMsg.author.tag,
            iconURL: quotedMsg.author.displayAvatarURL(),
        })
        .setDescription(
            quotedMsg.content ||
                (quotedMsg.poll ? `### Ankieta: ${quotedMsg.poll.question.text}\n\n- ${quotedMsg.poll.answers.map((q) => `${q.text} (${q.voters.cache?.size ?? '0'})`).join('\n- ')}` : '*brak treści*'),
        )
        .setTimestamp(quotedMsg.createdAt)
        .setFields([{ name: 'Link do wiadomości', value: `[Kliknij tutaj](https://canary.discord.com/channels/${client.guilds.cache.first()!.id}/${channelId}/${messageId})`, inline: true }])
        .setFooter({ text: `Wysłano w ${(channel as { name: string })?.name ?? 'piekarnii'}, id: ${quotedMsg.id}` })
        .setColor(color);

    if (quotedMsg.reference?.messageId) {
        try {
            const referenced = await quotedMsg.fetchReference();
            if (referenced) {
                embed.addFields({
                    name: 'Odpowiedź',
                    inline: true,
                    value: `[Kliknij tutaj](https://canary.discord.com/channels/${referenced.guildId}/${referenced.channelId}/${referenced.id})`,
                });
            }
        } catch {}
    }

    if (quotedMsg.attachments.size > 0) {
        const first = quotedMsg.attachments.first();
        if (first?.contentType?.startsWith('image/')) {
            embed.setImage(first.url);
        } else {
            embed.addFields({
                name: 'Załączniki',
                value: quotedMsg.attachments.map((a) => `[${a.name}](${a.url})`).join('\n'),
                inline: true,
            });
        }
    }

    return embed;
}
