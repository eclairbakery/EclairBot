import * as dsc from 'discord.js';

import { MusicEntry } from '@/bot/apis/db/db-defs.ts';

export function extractMediaLinks(text: string): string[] {
    const pattern = /https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be|music\.youtube\.com|open\.spotify\.com)\/[^\s]+/g;

    return (text.match(pattern) || []).map(link =>
        link.replace(/[),.]+$/, '')
    );
}

export async function scanChannelForMusic(channel: dsc.GuildTextBasedChannel): Promise<MusicEntry[]> {
    const musicEntries: MusicEntry[] = [];
    let lastMessageId: string | undefined;

    while (true) {
        const messages = await channel.messages.fetch({
            limit: 100,
            before: lastMessageId
        });

        if (messages.size === 0) {
            break;
        }

        for (const message of messages.values()) {
            if (message.author.bot) continue;
            
            const links = extractMediaLinks(message.content);
            for (const link of links) {
                musicEntries.push({
                    authorId: message.author.id,
                    musicUrl: link
                });
            }
        }

        lastMessageId = messages.lastKey();
    }

    return musicEntries;
}
