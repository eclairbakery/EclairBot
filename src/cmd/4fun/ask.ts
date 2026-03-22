import { Command } from '@/bot/command.ts';
import { CommandFlags } from '@/bot/apis/commands/misc.ts';

import * as gemini from '@/bot/apis/gemini/model.ts';
import * as dsc from 'discord.js';

import { SystemPrompt } from '@/features/init-ai-models.ts';
import { output } from '@/bot/logging.ts';
import { cfg } from '../../bot/cfg.ts';
import { fetchPost } from '@/bot/apis/reddit/reddit.ts';
import * as github from '@/bot/apis/github/github.ts';
import { client } from '../../client.ts';

const toolDeclarations: gemini.Tool[] = [
    {
        functionDeclarations: [
            {
                name: 'list_categories',
                description: 'Zwraca listę wszystkich kategorii komend bota.',
                parameters: {
                    type: gemini.SchemaType.OBJECT,
                    properties: {},
                },
            },
            {
                name: 'list_commands',
                description: 'Zwraca listę wszystkich dostępnych komend bota w danej kategorii wraz z ich krótkimi opisami.',
                parameters: {
                    type: gemini.SchemaType.OBJECT,
                    properties: {
                        category: {
                            type: gemini.SchemaType.STRING,
                            description: "Kategoria do filtrowania komend (np. 'economy', 'mod', 'general').",
                        },
                    },
                    required: ['category'],
                },
            },
            {
                name: 'get_command_help',
                description: 'Zwraca szczegółowe informacje o konkretnej komendzie, w tym jej opis, aliasy i argumenty.',
                parameters: {
                    type: gemini.SchemaType.OBJECT,
                    properties: {
                        command_name: {
                            type: gemini.SchemaType.STRING,
                            description: 'Nazwa komendy do sprawdzenia.',
                        },
                    },
                    required: ['command_name'],
                },
            },
            {
                name: 'search_command',
                description: 'Szuka komendy na podstawie słowa kluczowego lub fragmentu opisu.',
                parameters: {
                    type: gemini.SchemaType.OBJECT,
                    properties: {
                        query: {
                            type: gemini.SchemaType.STRING,
                            description: 'Słowo kluczowe do wyszukania w nazwach i opisach komend.',
                        },
                    },
                    required: ['query'],
                },
            },
            {
                name: 'get_server_stats',
                description: 'Zwraca statystyki serwera, takie jak całkowita liczba użytkowników i liczba aktywnych osób.',
                parameters: {
                    type: gemini.SchemaType.OBJECT,
                    properties: {},
                },
            },
            {
                name: 'fetch_reddit_post',
                description: 'Pobiera treść posta z Reddita na podstawie podanego linku.',
                parameters: {
                    type: gemini.SchemaType.OBJECT,
                    properties: {
                        url: {
                            type: gemini.SchemaType.STRING,
                            description: 'Link do posta na Reddicie.',
                        },
                    },
                    required: ['url'],
                },
            },
            {
                name: 'github_get_repo_tree',
                description: 'Pobiera listę plików w repozytorium GitHub.',
                parameters: {
                    type: gemini.SchemaType.OBJECT,
                    properties: {
                        owner: { type: gemini.SchemaType.STRING, description: 'Właściciel repozytorium.' },
                        repo: { type: gemini.SchemaType.STRING, description: 'Nazwa repozytorium.' },
                        branch: { type: gemini.SchemaType.STRING, description: 'Branch (opcjonalnie, domyślnie main).' },
                    },
                    required: ['owner', 'repo'],
                },
            },
            {
                name: 'github_get_file_content',
                description: 'Pobiera zawartość konkretnego pliku z repozytorium GitHub.',
                parameters: {
                    type: gemini.SchemaType.OBJECT,
                    properties: {
                        owner: { type: gemini.SchemaType.STRING, description: 'Właściciel repozytorium.' },
                        repo: { type: gemini.SchemaType.STRING, description: 'Nazwa repozytorium.' },
                        path: { type: gemini.SchemaType.STRING, description: 'Ścieżka do pliku.' },
                        branch: { type: gemini.SchemaType.STRING, description: 'Branch (opcjonalnie, domyślnie main).' },
                    },
                    required: ['owner', 'repo', 'path'],
                },
            },
            {
                name: 'github_search_code',
                description: 'Przeszukuje kod wewnątrz repozytorium GitHub.',
                parameters: {
                    type: gemini.SchemaType.OBJECT,
                    properties: {
                        owner: { type: gemini.SchemaType.STRING, description: 'Właściciel repozytorium.' },
                        repo: { type: gemini.SchemaType.STRING, description: 'Nazwa repozytorium.' },
                        query: { type: gemini.SchemaType.STRING, description: 'Zapytanie wyszukiwania.' },
                    },
                    required: ['owner', 'repo', 'query'],
                },
            },
            {
                name: 'github_get_readme',
                description: 'Pobiera zawartość pliku README z repozytorium GitHub.',
                parameters: {
                    type: gemini.SchemaType.OBJECT,
                    properties: {
                        owner: { type: gemini.SchemaType.STRING, description: 'Właściciel repozytorium.' },
                        repo: { type: gemini.SchemaType.STRING, description: 'Nazwa repozytorium.' },
                        branch: { type: gemini.SchemaType.STRING, description: 'Branch (opcjonalnie, domyślnie main).' },
                    },
                    required: ['owner', 'repo'],
                },
            },
        ],
    },
];

export const askCmd: Command = {
    name: 'ask',
    aliases: ['question', 'ei-ask'],
    description: {
        main: 'Zapytaj EI (Eclair Inteligence) o wszysko co tylko chcesz!',
        short: 'Zapytaj o coś EI',
    },
    flags: CommandFlags.None,

    expectedArgs: [
        {
            name: 'question',
            description: 'No twoje pytanie',
            type: { base: 'string', trailing: true },
            optional: false,
        },
    ],

    permissions: {
        allowedRoles: null,
        allowedUsers: null,
    },

    async execute(api) {
        if (!gemini.isInitialized()) {
            return api.log.replyError(
                api, 'Błąd',
                'Moduł integracji z gemini nie został załadowany przez eclairbota.'
                + 'A tak po ludzku to poprostu ktoś nie dał api key do .env',
            );
        }

        const model = gemini.getModel('ask-cmd');
        if (!model) {
            return api.log.replyError(api, 'Błąd', 'Model nie został zainicjowany.');
        }

        const formatUser = (u: dsc.User) =>
            u.id == client.user?.id
                ? `EclairBot (Ty)`
                : `${u.username} (${u.id}${u.id == api.invoker.id ? ', To osoba która której odpowiadasz!' : ''})`;

        const channel = api.channel as dsc.TextBasedChannel;
        const messages = await channel.messages.fetch({ limit: 10, before: api.raw.msg?.id });
        const chatHistory = messages.reverse().map((m) => `${formatUser(m.author)}: ${m.content}`).join('\n');

        let referencedContext = '';
        if (api.raw.msg && api.raw.msg.reference?.messageId) {
            try {
                const refMsg = await api.raw.msg.fetchReference();
                referencedContext = `\n\nUżytkownik odpowiada na wiadomość od ${formatUser(refMsg.author)}: "${refMsg.content}"`;
            } catch (err) {
                output.err(err);
            }
        }

        const toolHandlers = {
            list_categories: () => {
                const categories = Array.from(api.commands.keys());
                return {
                    categories: categories.map((c) => ({
                        id: c.stringId(),
                        name: c.name,
                        description: c.shortDesc,
                    })),
                };
            },
            list_commands: (args: { category: string }) => {
                const category = args.category;
                const cat = Array.from(api.commands.keys()).find((c) => c.stringId() === category || c.name.toLowerCase() === category.toLowerCase());
                if (!cat) return { error: `Nie znaleziono kategorii: ${category}` };
                const cmds = api.commands.get(cat) || [];
                return {
                    commands: cmds.map((c) => ({
                        name: c.name,
                        description: c.description.short,
                    })),
                };
            },
            get_command_help: (args: { command_name: string }) => {
                const command_name = args.command_name;
                for (const [_, cmds] of api.commands.entries()) {
                    const cmd = cmds.find((c) => c.name === command_name || c.aliases.includes(command_name));
                    if (cmd) {
                        return {
                            name: cmd.name,
                            aliases: cmd.aliases,
                            description: cmd.description.main,
                            args: cmd.expectedArgs.map((a) => ({
                                name: a.name,
                                description: a.description,
                                type: JSON.stringify(a.type),
                                optional: a.optional,
                            })),
                        };
                    }
                }
                return { error: `Nie znaleziono komendy: ${command_name}` };
            },
            search_command: (args: { query: string }) => {
                const query = args.query.toLowerCase();

                // deno-lint-ignore no-explicit-any
                const results: any[] = [];
                for (const [cat, cmds] of api.commands.entries()) {
                    for (const cmd of cmds) {
                        if (cmd.name.toLowerCase().includes(query) || cmd.description.main.toLowerCase().includes(query) || cmd.description.short.toLowerCase().includes(query)) {
                            results.push({
                                name: cmd.name,
                                category: cat.name,
                                description: cmd.description.short,
                            });
                        }
                    }
                }

                return { results: results.slice(0, 10) };
            },
            get_server_stats: () => {
                const guild = api.guild;
                if (!guild) return { error: 'Nie można pobrać statystyk serwera (brak gildii).' };

                const totalMembers = guild.memberCount;
                const activeMembers = guild.members.cache.filter((m) => m.presence?.status && m.presence.status !== 'offline').size;

                return {
                    totalMembers,
                    activeMembers,
                    serverName: guild.name,
                };
            },
            fetch_reddit_post: async (args: { url: string }) => {
                const post = await fetchPost(args.url);
                if (!post) return { error: 'Nie udało się pobrać posta z Reddita. Sprawdź czy link jest poprawny.' };
                return post;
            },
            github_get_repo_tree: async (args: { owner: string; repo: string; branch?: string }) => {
                try {
                    const tree = await github.getRepoTree({ owner: args.owner, repo: args.repo, branch: args.branch });
                    return { tree };
                } catch (err: unknown) {
                    return { error: (err as Error).message };
                }
            },
            github_get_file_content: async (args: { owner: string; repo: string; path: string; branch?: string }) => {
                try {
                    const content = await github.getFileContent({ owner: args.owner, repo: args.repo, branch: args.branch }, args.path);
                    return { content };
                } catch (err: unknown) {
                    return { error: (err as Error).message };
                }
            },
            github_search_code: async (args: { owner: string; repo: string; query: string }) => {
                try {
                    const results = await github.search({ owner: args.owner, repo: args.repo }, args.query);
                    return { results };
                } catch (err: unknown) {
                    return { error: (err as Error).message };
                }
            },
            github_get_readme: async (args: { owner: string; repo: string; branch?: string }) => {
                try {
                    const content = await github.getReadme({ owner: args.owner, repo: args.repo, branch: args.branch });
                    return { content };
                } catch (err: unknown) {
                    return { error: (err as Error).message };
                }
            },
        };

        const finalSystemInstruction = [
            SystemPrompt,
            '',
            '### KONTEKST OSTATNICH WIADOMOŚCI Z KANAŁU',
            chatHistory,
            referencedContext,
            'WAŻNE: Używaj narzędzi do sprawdzania dokumentacji komend bota oraz integracji z GitHubem. Nie używaj żadnych prefiksów w nazwach narzędzi.',
        ].join('\n');

        const question = api.getTypedArg('question', 'string').value!;
        const contents: gemini.Content[] = [
            { role: 'user', parts: [{ text: question }] }
        ];

        let prefixChecked = false;
        const allPrefixes = [cfg.commands.prefix, ...cfg.commands.alternativePrefixes];

        let result = await model.generateContent({
            contents,
            systemInstruction: {
                role: 'system',
                parts: [{ text: finalSystemInstruction }]
            },
            tools: toolDeclarations,
        });

        let candidate = result.response.candidates?.[0];

        while (candidate?.content.parts.some(p => p.functionCall)) {
            contents.push(candidate.content);

            const functionResponses: gemini.Part[] = [];
            for (const part of candidate.content.parts) {
                if (part.functionCall) {
                    const originalName = part.functionCall.name;
                    const cleanName = originalName.split(':').pop()!;

                    // deno-lint-ignore no-explicit-any
                    const handler = (toolHandlers as any)[cleanName];
                    const toolResult = handler ? await handler(part.functionCall.args) : { error: `Narzędzie '${cleanName}' nie zostało znalezione.` };

                    functionResponses.push({
                        functionResponse: {
                            name: originalName,
                            response: toolResult
                        }
                    });
                }
            }

            contents.push({ role: 'function', parts: functionResponses });

            result = await model.generateContent({
                contents,
                systemInstruction: {
                    role: 'system',
                    parts: [{ text: finalSystemInstruction }]
                },
                tools: toolDeclarations,
            });

            candidate = result.response.candidates?.[0];
        }

        let content = result.response.text();
        if (content.trim().length > 0) {
            if (!prefixChecked) {
                if (allPrefixes.some((p) => content.startsWith(p))) {
                    content = '... ' + content;
                }
                prefixChecked = true;
            }

            const payload = {
                content,
                allowedMentions: {
                    parse: [],
                },
            };

            await api.reply(payload as dsc.MessageReplyOptions);
        }
    },
};

