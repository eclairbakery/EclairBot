import { Command, Category } from '../../bot/command.js';
import { PredefinedColors } from '../../util/color.js';
import { cfg } from '../../bot/cfg.js';
import { db, sqlite } from '../../bot/db.js';

import * as log from '../../util/log.js';
import * as dsc from 'discord.js';

import findCommand from '../../util/findCommand.js';

interface WikiSummaryResponse {
    type: string;
    title: string;
    displaytitle: string;
    namespace: {
        id: number;
        text: string;
    };
    wikibase_item: string;
    titles: {
        canonical: string;
        normalized: string;
        display: string;
    };
    pageid: number;
    thumbnail?: {
        source: string;
        width: number;
        height: number;
    };
    originalimage?: {
        source: string;
        width: number;
        height: number;
    };
    lang: string;
    dir: string;
    revision: string;
    tid: string;
    timestamp: string;
    description?: string;
    description_source?: string;
    content_urls: {
        desktop: { page: string };
        mobile: { page: string };
    };
    extract: string; 
    extract_html: string;
}

async function getDisambiguationTitles(title: string): Promise<string[]> {
    const url = `https://pl.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=links&format=json`;
    const res = await fetch(url);
    const data = await res.json() as any;

    if (!data.parse?.links) return [];

    const titles: string[] = data.parse.links
        .filter((l: any) => l.ns === 0)
        .map((l: any) => l['*']);

    return titles;
}

async function downloadFromWikipedia(language_versions: string[], args: string[]) {
    let fetched: Response;
    for (const lang of language_versions) {
        const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(args.join('_'))}`;
        fetched = await fetch(url);
        if (!fetched.ok) continue;
        break;
    }
    return fetched;
}

export const wikiCmd: Command = {
    name: 'wiki',
    longDesc: 'Generalnie pobiera artykuł z Wikipedii. Super użyteczne!',
    shortDesc: 'Pobiera rzecz z Wikipedii!',
    expectedArgs: [],
    aliases: [],
    allowedRoles: null,
    allowedUsers: [],
    async execute(msg, args) {
        const fetched = await downloadFromWikipedia(['pl' /** polish */, 'simple' /** simple english */, 'en' /** english */], args);
        if (!fetched.ok) {
            return msg.reply({
                embeds: [
                    {
                        author: {
                            name: 'EclairBOT'
                        },
                        title: 'Tego artykułu nie ma na Wikipedii!',
                        description: 'Wiem, to niemożliwe...',
                        color: PredefinedColors.Orange
                    }
                ]
            });
        }
        const json = await fetched.json() as WikiSummaryResponse;
        if (json.description?.includes('strona ujednoznaczniająca')) {
            const titles = await getDisambiguationTitles(json.title);
            return msg.reply({
                embeds: [
                    {
                        author: {
                            name: 'EclairBOT'
                        },
                        title: 'Doprecyzuj!',
                        description: `Natrafiłeś na stronę ujednoznaczniającą. Ona wyświetla różne znaczenia wyrazu...\n${titles.join(', ')}`,
                        url: json.content_urls.desktop.page,
                        color: PredefinedColors.Cyan
                    }
                ]
            });
        }
        return msg.reply({
            embeds: [
                {
                    author: {
                        name: 'EclairBOT'
                    },
                    title: json.titles.normalized,
                    description: json.extract,
                    url: json.content_urls.desktop.page,
                    color: PredefinedColors.YellowGreen,
                    thumbnail: json.thumbnail ? {
                        url: json.thumbnail.source,
                        height: json.thumbnail.height,
                        width: json.thumbnail.width
                    } : undefined
                }
            ]
        });
    },
};