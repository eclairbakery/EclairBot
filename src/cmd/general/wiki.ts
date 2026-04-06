import { Command } from '@/bot/command.ts';
import { CommandFlags } from '@/bot/apis/commands/misc.ts';
import { CommandAPI } from '@/bot/apis/commands/api.ts';
import { PredefinedColors } from '@/util/color.ts';
import * as gemini from "@/bot/apis/gemini/model.ts"

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
    const data = await res.json() as { parse?: { links: { ns: number; '*': string }[] } };

    if (!data.parse?.links) return [];

    return data.parse.links.filter((l) => l.ns === 0).map((l) => l['*']);
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
        short: 'Pobiera rzecz z Wikipedii!',
    },
    flags: CommandFlags.None | CommandFlags.WorksInDM,

    expectedArgs: [
        {
            name: 'query',
            type: { base: 'string', trailing: true },
            optional: false,
            description: 'No, podaj jaki jest ten twój artykuł do pobrania!',
        },
    ],
    permissions: {
        allowedRoles: null,
        allowedUsers: null,
    },
    execute: async (api: CommandAPI) => {
        const rawQuery = api.getTypedArg('query', 'string')?.value as string;

        const query = rawQuery == 'hubix' ? 'Niepełnosprawność intelektualna w stopniu głębokim' : rawQuery;
        if (!query) return api.log.replyError(api, 'Masz problem', 'Musisz podać, czego szukasz na Wikipedii!');

        const msg = await api.log.replyTip(
            api, 'Uzbroj się w cierpliwość',
            'Z powodu na powolność Wikipedii to może to chwilę potrwać byś dostał odpowiedź.'
        );

        const fetched = await downloadFromWikipedia(['pl', 'simple', 'en'], [query]);
        if (!fetched || !fetched.ok) {
            const model = gemini.getModel("wiki-cmd");
            if (!model) {
                return msg.edit({
                    embeds: [{
                        author: { name: "EclairBOT" },
                        title: 'Nie udało mi się znaleźć definicji',
                        description: "Aktualnie model AI jest niezainicjalizowany, a na Wikipedii nie ma o tym artykułu.",
                        color: PredefinedColors.Red
                    }]
                });
            }
            let result: gemini.GenerateContentResult; 
            try {
                result = await model.generateContent({
                    contents: [
                        { role: 'user', parts: [ { text: query } ] }                    
                    ]
                });
            } catch {
                return msg.edit({
                    embeds: [{
                        author: { name: "EclairBOT" },
                        title: 'Nie udało mi się znaleźć definicji',
                        description: "Aktualnie model AI nie chce Ci odpowiedzieć (jakiś rate-limit idk), a na Wikipedii nie ma o tym artykułu.",
                        color: PredefinedColors.Red
                    }]
                });
            }
            const ai_response = result.response.text();
            if (ai_response.toLowerCase().trim().includes('#ignore'))
            return msg.edit({
                embeds: [{
                    author: { name: "EclairBOT" },
                    title: 'Nie udało mi się znaleźć definicji',
                    description: "Aktualnie model AI świadomie postanowił Cię zlać, a na Wikipedii nie ma o tym artykułu.",
                    color: PredefinedColors.Red
                }]
            });
            const ai_fl = ai_response.split('\n')[0].trim();
            const ai_has_title = ai_fl.startsWith('# ');
            const ai_description = ai_has_title ? ai_response.slice(ai_fl.length).trim() : ai_response;
            return msg.edit({
                embeds: [{
                    author: { name: "EclairBOT" },
                    title: ai_has_title ? ai_fl.replace('# ', '') : "Definicja od AI",
                    description: ai_description,
                    color: PredefinedColors.YellowGreen,
                    url: `https://google.com/search?q=${encodeURIComponent(query)}`,
                    footer: {
                        text: "Ponieważ na Wikipedii nie ma artykułu o tej nazwie, ta definicja pochodzi od AI. Sprawdź ważne fakty samodzielnie."
                    }
                }]
            });
        }

        const json = await fetched.json() as WikiSummaryResponse;

        const extrdesc = (json.extract ?? '') + (json.description ?? '');

        if (extrdesc?.includes('strona ujednoznaczniająca') || extrdesc?.includes('may refer to')) {
            const titles = await getDisambiguationTitles(json.title);
            return msg.edit({
                embeds: [{
                    author: { name: 'EclairBOT' },
                    title: 'Doprecyzuj!',
                    description: `Natrafiłeś na stronę ujednoznaczniającą. W skrócie to Wikipedia nie jest pewna, czego ty szukasz, więc Ci to wyświetliła, by ci pomóc.\n\n**Tu masz hasła, które się mogą kryć pod Twoim zapytaniem**:\n- ${titles.join('\n- ')}`,
                    url: json.content_urls.desktop.page,
                    color: PredefinedColors.Cyan,
                }],
            });
        }

        return msg.edit({
            embeds: [{
                author: { name: 'EclairBOT' },
                title: json.titles.normalized,
                description: json.extract,
                url: json.content_urls.desktop.page,
                color: PredefinedColors.YellowGreen,
                thumbnail: json.thumbnail
                    ? {
                        url: json.thumbnail.source,
                        height: json.thumbnail.height,
                        width: json.thumbnail.width,
                    }
                    : undefined,
            }],
        });
    },
};
