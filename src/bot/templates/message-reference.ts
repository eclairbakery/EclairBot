import type { Snowflake } from '@/defs.ts';
import type { PredefinedColors } from '@/util/color.ts';
import { GuildTextBasedChannel, HexColorString, Message, Poll } from 'discord.js';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.ts';
import { client } from '@/client.ts';

async function mkFormattedPoll(poll: Poll): Promise<string> {
    try {
        if (poll.partial) poll = await poll.fetch();
    } catch {}

    let output = `### Ankieta: ${poll.question.text}\n\n`;
    let voteCount = 0;
    for (const answer of poll.answers.values()) {
        output += `- ${answer.text} (głosów: ${answer.voteCount})\n`;
        voteCount += answer.voteCount;
    }
    output += `Łącznie głosów: ${voteCount}`;
    return output;
}

export async function mkMessageReferenceEmbed(
    source: {
        channelId: Snowflake, messageId: Snowflake,
    } | Message,
    options: {
        color?: HexColorString | PredefinedColors,
        title?: string
    }
) {
    const channel = !(source instanceof Message) 
        ? await client.channels.fetch(source.channelId) as GuildTextBasedChannel
        : source.channel as GuildTextBasedChannel;
    let quotedMsg = !(source instanceof Message)
        ? await channel.messages.fetch(source.messageId)
        : source;

    try {
        if (quotedMsg.partial)
            quotedMsg = await quotedMsg.fetch();
    } catch {}

    const embed = new ReplyEmbed()
        .setAuthor({
            name: quotedMsg.author.tag,
            iconURL: quotedMsg.author.displayAvatarURL(),
        })
        .setDescription(
            quotedMsg.content ||
                (quotedMsg.poll 
                    ? await mkFormattedPoll(quotedMsg.poll) 
                    : (quotedMsg.embeds.length > 0 
                        ? '*niestety cytowanie embedów nie jest jeszcze wspierane*'
                        : '*brak treści*'
                      )
                ),
        )
        .setTimestamp(quotedMsg.createdAt)
        .setFields([{ name: 'Link do wiadomości', value: `[Kliknij tutaj](https://canary.discord.com/channels/${channel.guildId}/${channel.id}/${quotedMsg.id})`, inline: true }])
        .setFooter({ text: `Wysłano w ${(channel as { name: string })?.name ?? 'piekarnii'}, id: ${quotedMsg.id}` });

    if (options.color) embed.setColor(options.color);
    if (options.title) embed.setTitle(options.title);

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
