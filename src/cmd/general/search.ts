import { Command } from '@/bot/command.ts';
import { CommandPermissions } from '@/bot/apis/commands/permissions.ts';
import { CommandFlags } from '@/bot/apis/commands/misc.ts';

const searxng_instances = [
    "https://searx.projectlounge.pw"
];

interface SearchResults {
    results: {
        title: string;
        content: string;
        url: string;
    }[];
};

function buildSearchURL(instance: string, query: string, json: boolean) {
    return `${instance}/search?q=${encodeURIComponent(query)}${json ? '&format=json' : ''}`;
}

async function getSearchResults(query: string): Promise<SearchResults | undefined> {
    for (const instance_url of searxng_instances) {
        try {
            const fetched = await fetch(buildSearchURL(instance_url, query, true));
            if (fetched.status !== 200) continue;

            return await fetched.json();
        } catch {}
    }

    return undefined;
}

export const searchCmd: Command = {
    name: 'search',
    aliases: ['szukaj', 'wyszukaj'],
    description: {
        main: "Użyj super search engine by wyszukiwać strony w internecie. Lepsze niż Google.",
        short: "Search engine do używania."
    },
    
    permissions: CommandPermissions.everyone(),
    flags: CommandFlags.None,

    expectedArgs: [
        {
            name: 'query', description: "To co chcesz wyszukać!",
            type: { base: 'string', trailing: true }, 
            optional: false
        }
    ],

    async execute(api) {
        const searchQuery = api.getTypedArg('query', 'string').value;
        const searchResults = await getSearchResults(searchQuery);
        if (!searchResults || searchResults.results.length == 0) {
            return await api.log.replyError(
                api, "Problem jest", 
                `Niestety żadna instancja nie zwróciła wyników dla twojego wyszukiwania.` +
                `[Może poszukaj w Google](${buildSearchURL('https://google.com', searchQuery, false)})`
            );
        }

        return api.log.replySuccess(
            api, searchQuery, 
            `- ${searchResults.results.slice(0,10).map((r) => `[${r.title}](${r.url})`).join('\n- ')}`
        )
    },
};
