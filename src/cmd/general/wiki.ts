import { Command} from "@/bot/command.js";
import { CommandFlags } from '@/bot/apis/commands/misc.js';
import { CommandPermissions } from '@/bot/apis/commands/permissions.js';
import { CommandAPI } from '@/bot/apis/commands/api.js';
import { PredefinedColors } from '@/util/color.js';

import { cfg } from '@/bot/cfg.js';

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
            type: { base: 'string', trailing: true },
            optional: false,
            description: 'No, podaj jaki jest ten twój artykuł do pobrania!'
        }
    ],
    permissions: {
        allowedRoles: null,
        allowedUsers: null
    },
    execute: async (api: CommandAPI) => {
        const rawQuery = api.getTypedArg('query', 'string')?.value as string;

        const query =
            rawQuery == 'hubix' ? 'pedał'
            : rawQuery

        if (!query) return api.reply('Musisz podać, czego szukasz na Wikipedii!');

        const lowerQuery = query.toLowerCase();
        if (['auroros', 'eklerka', 'piekarnia eklerki', 'gorciu', 'maqix'].some(bad => lowerQuery.includes(bad))) {
            return api.reply({
                embeds: [{
                    author: { name: 'EclairBOT' },
                    title: 'Ta komenda nie jest do tego!',
                    description: 'Rzeczy takie jak `eklerka`, `aurorOS`, `piekarnia eklerki`, `gorciu`, `maqix`, itd. nie są na wikipedii... Po prostu nie spodziewaj się, że jest to wiki serwera.',
                    color: PredefinedColors.Blurple
                }]
            });
        }

        const fetched = await downloadFromWikipedia(['pl', 'simple', 'en'], [query]);
        if (!fetched || !fetched.ok) {
            return api.reply({
                embeds: [{
                    author: { name: 'EclairBOT' },
                    title: 'Tego artykułu nie ma na Wikipedii!',
                    description: 'Wiem, to niemożliwe...',
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
                    title: 'Doprecyzuj!',
                    description: `Natrafiłeś na stronę ujednoznaczniającą. Ona wyświetla różne znaczenia wyrazu...\n${titles.join(', ')}`,
                    url: json.content_urls.desktop.page,
                    color: PredefinedColors.Cyan
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
