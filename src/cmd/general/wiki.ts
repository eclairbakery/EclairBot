import { Command, CommandAPI, CommandFlags } from '@/bot/command.js';
import { PredefinedColors } from '@/util/color.js';

import { cfg } from '@/bot/cfg.js';

import * as dsc from 'discord.js';

interface WikiSummaryResponse {
    type: string;
    title: string;
    displaytitle: string;
    namespace: { id: number; text: string };
    wikibase_item: string;
    titles: { canonical: string; normalized: string; display: string };
    pageid: number;
    thumbnail?: { source: string; width: number; height: number };
    originalimage?: { source: string; width: number; height: number };
    lang: string;
    dir: string;
    revision: string;
    tid: string;
    timestamp: string;
    description?: string;
    description_source?: string;
    content_urls: { desktop: { page: string }; mobile: { page: string } };
    extract: string;
    extract_html: string;
}

async function getDisambiguationTitles(title: string): Promise<string[]> {
    const url = `https://pl.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=links&format=json`;
    const res = await fetch(url);
    const data = await res.json() as any;

    if (!data.parse?.links) return [];

    return data.parse.links.filter((l: any) => l.ns === 0).map((l: any) => l['*']);
}

async function downloadFromWikipedia(languageVersions: string[], args: string[]) {
    let fetched: Response;
    for (const lang of languageVersions) {
        const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(args.join('_'))}`;
        fetched = await fetch(url);
        if (!fetched.ok) continue;
        break;
    }
    return fetched!;
}

export const wikiCmd: Command = {
    name: 'wiki',
    aliases: [],
    description: {
        main: 'Generalnie pobiera artykuł z Wikipedii. Super użyteczne!',
        short: 'Pobiera rzecz z Wikipedii!'
    },
    flags: CommandFlags.None | CommandFlags.WorksInDM,

    expectedArgs: [
        {
            name: 'query',
            type: 'trailing-string',
            optional: false,
            description: 'No, podaj jaki jest ten twój artykuł do pobrania!'
        }
    ],
    permissions: {
        allowedRoles: null,
        allowedUsers: null
    },
    execute: async (api: CommandAPI) => {
        const rawQuery = api.getTypedArg('query', 'trailing-string')?.value as string;

        const query =
            rawQuery == 'hubix' ? 'pedał'
            : rawQuery

        if (!query) return api.reply('Musisz podać, czego szukasz na Wikipedii!');

        const lowerQuery = query.toLowerCase();
        if (['auroros', 'eklerka', 'piekarnia eklerki', 'gorciu', 'maqix'].some(bad => lowerQuery.includes(bad))) {
            return api.reply({
                embeds: [{
                    author: { name: 'EclairBOT' },
                    title: cfg.customization.uncategorized.wikiIsNotFandomHeader,
                    description: cfg.customization.uncategorized.wikiIsNotFandomText,
                    color: PredefinedColors.Blurple
                }]
            });
        }

        const fetched = await downloadFromWikipedia(['pl', 'simple', 'en'], [query]);
        if (!fetched || !fetched.ok) {
            return api.reply({
                embeds: [{
                    author: { name: 'EclairBOT' },
                    title: cfg.customization.uncategorized.wikiUnknownArticleHeader,
                    description: cfg.customization.uncategorized.wikiUnknownArticleText,
                    color: PredefinedColors.Orange
                }]
            });
        }

        const json = await fetched.json() as WikiSummaryResponse;

        if (json.description?.includes('strona ujednoznaczniająca') || json.description?.includes('may refer to')) {
            const titles = await getDisambiguationTitles(json.title);
            return api.reply({
                embeds: [{
                    author: { name: 'EclairBOT' },
                    title: cfg.customization.uncategorized.wikiDisambiguationPageHeader,
                    description: `${cfg.customization.uncategorized.wikiDisambiguationPageText}\n${titles.join(', ')}`,
                    url: json.content_urls.desktop.page,
                    color: PredefinedColors.Cyan
                }]
            });
        }

        const allin1 = ((json.description ?? '') + (json.titles.normalized)).toLowerCase();

        if (
            (allin1.includes('seks') || allin1.includes('sex') || allin1.includes('porn')) &&
            api.channel.id !== cfg.unfilteredRelated.unfilteredChannel
        ) {
            return api.reply({
                embeds: [{
                    author: { name: 'EclairBOT' },
                    title: 'Weź się lecz 🥀',
                    description: `Zastanawia mnie bardzo dlaczego interesują cię tak nieludzkie hasła. Pewnie w twojej okolicy jest jakiś psycholog, który udzieli ci wsparcia. Dobra, co ja piszę... Po prostu przestań się tym interesować, a jak nie możesz to idź na <#${cfg.unfilteredRelated.unfilteredChannel}> i nie narażaj innych na te treści`,
                    url: 'https://www.redirectionprogram.com/pl/',
                    color: PredefinedColors.DarkOrange
                }]
            });
        }

        if (
            (allin1.includes('dsc.gg') || allin1.includes('discord.com/invite') || allin1.includes('discord.gg')) &&
            api.channel.id !== cfg.unfilteredRelated.unfilteredChannel
        ) {
            return api.reply({
                embeds: [{
                    author: { name: 'EclairBOT' },
                    title: 'Weź się lecz 🥀',
                    description: `Jak już się reklamujesz Wikipedią to na <#${cfg.unfilteredRelated.unfilteredChannel}> plz.`,
                    url: 'https://www.reklama.pl/',
                    color: PredefinedColors.DarkOrange
                }]
            });
        }

        return api.reply({
            embeds: [{
                author: { name: 'EclairBOT' },
                title: json.titles.normalized,
                description: json.extract,
                url: json.content_urls.desktop.page,
                color: PredefinedColors.YellowGreen,
                thumbnail: json.thumbnail ? {
                    url: json.thumbnail.source,
                    height: json.thumbnail.height,
                    width: json.thumbnail.width
                } : undefined
            }]
        });
    }
};
