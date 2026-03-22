import { MessageEventCtx, PredefinedActionEventTypes } from '../index.ts';
import { commands } from '../../../cmd/list.ts';
import { Action } from '../index.ts';
import * as dsc from 'discord.js';
import { output } from '../../../bot/logging.ts';
import * as log from '@/util/log.ts';
import { client } from '../../../client.ts';
import * as gemini from "@/bot/apis/gemini/model.ts";
import { fetchPost } from '@/bot/apis/reddit/reddit.ts';
import * as github from '@/bot/apis/github/github.ts';
import { toolDeclarations } from '../../../bot/apis/gemini/ask.ts';
import { SystemPrompt } from '../../init-ai-models.ts';
import { cfg } from '../../../bot/cfg.ts';

export const askAction: Action<MessageEventCtx> = {
    activationEventType: [PredefinedActionEventTypes.OnMessageCreate],

    constraints: [
        (ctx) => ctx.author.id != client.user?.id,
        (ctx) => ctx.channelId == cfg.channels.general.ei ||
                 ctx.content.trim().startsWith(`<@${client.user?.id}>`)
    ],

    callbacks: [async (msg) => {
        if (!gemini.isInitialized()) {
            return log.replyError(
                msg,
                'Błąd',
                'Moduł integracji z gemini nie został załadowany przez eclairbota.' +
                    'A tak po ludzku to poprostu ktoś nie dał api key do .env',
            );
        }

        const model = gemini.getModel('ask-cmd');
        if (!model) {
            return log.replyError(msg, 'Błąd', 'Model nie został zainicjowany.');
        }

        const formatUser = (u: dsc.User) => u.id == client.user?.id 
            ? `EclairBot (Ty)`
            : `${u.username} (${u.id}${u.id == msg.author.id ? ', To osoba która której odpowiadasz!' : ''})`;

        const channel = msg.channel as dsc.TextBasedChannel;
        const messages = await channel.messages.fetch({ limit: 10, before: msg?.id });
        const chatHistory = messages.reverse();
        let chatHistoryFormatted: string = '';
        for (const m of chatHistory.values()) {
            let refString: string = '';
            if (m.reference) {
                const ref = await m.fetchReference();
                refString = `(Odpowiedź na wiadomość od ${formatUser(ref.author)}: "${ref.content.replace('"', '\\"')}") `;
            }
            chatHistoryFormatted += `${refString}${formatUser(m.author)}: ${m.content}`;
        }

        let referencedContext = '';
        if (msg.reference?.messageId) {
            try {
                const refMsg = await msg.fetchReference();
                referencedContext = `\n\nUżytkownik odpowiada na wiadomość od ${formatUser(refMsg.author)}: "${refMsg.content}"`;
            } catch (err) {
                output.err(err);
            }
        }

        const toolHandlers = {
            list_categories: () => {
                const categories = Array.from(commands.keys());
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
                const cat = Array.from(commands.keys()).find((c) => c.stringId() === category || c.name.toLowerCase() === category.toLowerCase());
                if (!cat) return { error: `Nie znaleziono kategorii: ${category}` };
                const cmds = commands.get(cat) || [];
                return {
                    commands: cmds.map((c) => ({
                        name: c.name,
                        description: c.description.short,
                    })),
                };
            },
            get_command_help: (args: { command_name: string }) => {
                const command_name = args.command_name;
                for (const [_, cmds] of commands.entries()) {
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
                for (const [cat, cmds] of commands.entries()) {
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
                const guild = msg.guild;
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
            chatHistoryFormatted,
            referencedContext,
            'WAŻNE: Używaj narzędzi do sprawdzania dokumentacji komend bota oraz integracji z GitHubem. Nie używaj żadnych prefiksów w nazwach narzędzi.',
        ].join('\n');

        const question = msg.content.trim().startsWith(`<@${client.user!.id}>`) 
            ? msg.content.trim().replace(`<@${client.user!.id}>`, '')
            : msg.content;
        const contents: gemini.Content[] = [
            { role: 'user', parts: [{ text: question }] },
        ];

        let prefixChecked = false;
        const allPrefixes = [cfg.commands.prefix, ...cfg.commands.alternativePrefixes];

        let result = await model.generateContent({
            contents,
            systemInstruction: {
                role: 'system',
                parts: [{ text: finalSystemInstruction }],
            },
            tools: toolDeclarations,
        });

        let candidate = result.response.candidates?.[0];

        while (candidate?.content.parts.some((p) => p.functionCall)) {
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
                            response: toolResult,
                        },
                    });
                }
            }

            contents.push({ role: 'function', parts: functionResponses });

            result = await model.generateContent({
                contents,
                systemInstruction: {
                    role: 'system',
                    parts: [{ text: finalSystemInstruction }],
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

            await msg.reply(payload as dsc.MessageReplyOptions);
        }
    }],
};
