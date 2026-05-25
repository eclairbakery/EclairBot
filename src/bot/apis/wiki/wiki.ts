import * as gemini from '@/bot/apis/gemini/model.ts';

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

async function getDisambiguationTitles(title: string, lang: string): Promise<string[]> {
    const url = `https://${lang}.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=links&format=json`;
    const res = await fetch(url);
    const data = await res.json() as { parse?: { links: { ns: number; '*': string }[] } };

    if (!data.parse?.links) return [];

    return data.parse.links.filter((l) => l.ns === 0).map((l) => l['*']);
}

async function downloadFromWikipedia(languageVersions: string[], args: string[]) {
    let fetched: Response;
    let lango: string = null!;
    for (const lang of languageVersions) {
        const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(args.join('_'))}`;
        fetched = await fetch(url);
        if (!fetched.ok) continue;
        lango = lang;
        break;
    }
    return { fetched: fetched!, lang: lango };
}

export interface WikiError {
    success: false;
    reason: 'ai-uninitialized' | 'ai-error' | 'ai-ignore';
}

export interface WikiResponse {
    success: true;
    isDisamiguition: false;
    usedAi: boolean;
    title: string;
    description: string;
    url: string;
    thumbnail?: WikiSummaryResponse['thumbnail']
}

export interface WikiDisamiguition {
    success: true;
    isDisamiguition: true;
    queries: string[];
    url: string;
}

export default async function getWikiArticle(rawQuery: string): Promise<WikiError | WikiResponse | WikiDisamiguition> {
    const query = rawQuery == 'hubix' ? 'Niepełnosprawność intelektualna w stopniu głębokim' : rawQuery;

    const fetched_raw = await downloadFromWikipedia(['pl', 'simple', 'en'], [query]);
    const fetched = fetched_raw.fetched;

    if (!fetched || !fetched.ok) {
        if (!gemini.isInitialized() || !gemini.getModels('wiki-cmd').length) {
            return { success: false, reason: 'ai-uninitialized' };
        }
        let result: gemini.GenerateContentResult;
        try {
            result = await gemini.generateContent('wiki-cmd', {
                contents: [
                    { role: 'user', parts: [{ text: query }] },
                ],
            });
        } catch {
            return { success: false, reason: 'ai-error' };
        }
        const ai_response = result.response.text();
        if (ai_response.toLowerCase().trim().includes('--ignore')) {
            return { success: false, reason: 'ai-ignore' };
        }
        const ai_fl = ai_response.split('\n')[0].trim();
        const ai_has_title = ai_fl.startsWith('# ');
        const ai_description = ai_has_title ? ai_response.slice(ai_fl.length).trim() : ai_response;
        return {
            success: true, usedAi: true, isDisamiguition: false,
            title: ai_has_title ? ai_fl.replace('# ', '') : 'Definicja od AI',
            description: ai_description, url: `https://google.com/search?q=${encodeURIComponent(query)}` 
        };
    }

    const json = await fetched.json() as WikiSummaryResponse;

    const extrdesc = (json.extract ?? '') + (json.description ?? '');

    if (extrdesc?.includes('strona ujednoznaczniająca') || extrdesc?.includes('may refer to')) {
        const titles = await getDisambiguationTitles(json.title, fetched_raw.lang);
        return {
            success: true, isDisamiguition: true,
            url: json.content_urls.desktop.page,
            queries: titles
        };
    }
    
    return {
        success: true, usedAi: false,
        isDisamiguition: false,
        title: json.titles.normalized,
        description: json.extract,
        url: json.content_urls.desktop.page,
        thumbnail: json.thumbnail
    }
} 

