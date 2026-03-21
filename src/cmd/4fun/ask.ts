import { Command } from '@/bot/command.ts';
import { CommandFlags } from '@/bot/apis/commands/misc.ts';

import * as gemini from '@/bot/apis/gemini/model.ts';
import * as dsc from 'discord.js';

import { SystemPrompt } from '@/features/init-ai-models.ts';
import { output } from '@/bot/logging.ts';
import { cfg } from '../../bot/cfg.ts';

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

        const channel = api.channel as dsc.TextBasedChannel;
        const messages = await channel.messages.fetch({ limit: 10, before: api.raw.msg?.id });
        const chatHistory = messages.reverse().map((m) => `${m.author?.username ?? 'Nieznany'}: ${m.content}`).join('\n');

        let referencedContext = '';
        if (api.raw.msg && api.raw.msg.reference?.messageId) {
            try {
                const refMsg = await api.raw.msg.fetchReference();
                referencedContext = `\n\nUżytkownik odpowiada na wiadomość od ${refMsg.author?.username ?? 'Nieznany'}: "${refMsg.content}"`;
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

                interface ResultDef {
                    name: string;
                    category: string;
                    description: string;
                };
                const results: ResultDef[] = [];
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
        };

        const question = api.getTypedArg('question', 'string').value!;
        const finalSystemInstruction = `${SystemPrompt}\n\n### KONTEKST OSTATNICH WIADOMOŚCI Z KANAŁU\n${chatHistory}${referencedContext}\n\nWAŻNE: Używaj narzędzi do sprawdzania dokumentacji komend bota. Nie używaj żadnych prefiksów w nazwach narzędzi.`;

        const contents: gemini.Content[] = [
            { role: 'user', parts: [{ text: question }] }
        ];

        let responseStream = await model.generateContentStream({
            contents,
            systemInstruction: {
                role: 'system',
                parts: [{ text: finalSystemInstruction }]
            },
            tools: toolDeclarations,
        });

        let result = await responseStream.response;
        let candidate = result.candidates?.[0];

        while (candidate?.content.parts.some(p => p.functionCall)) {
            contents.push(candidate.content);

            const functionResponses: gemini.Part[] = [];
            for (const part of candidate.content.parts) {
                if (part.functionCall) {
                    const originalName = part.functionCall.name;
                    const cleanName = originalName.split(':').pop()!;

                    // deno-lint-ignore no-explicit-any
                    const handler = (toolHandlers as any)[cleanName];
                    const toolResult = handler ? handler(part.functionCall.args) : { error: `Narzędzie '${cleanName}' nie zostało znalezione.` };

                    functionResponses.push({
                        functionResponse: {
                            name: originalName,
                            response: toolResult
                        }
                    });
                }
            }

            contents.push({ role: 'user', parts: functionResponses });

            responseStream = await model.generateContentStream({
                contents,
                systemInstruction: {
                    role: 'system',
                    parts: [{ text: finalSystemInstruction }]
                },
                tools: toolDeclarations,
            });

            result = await responseStream.response;
            candidate = result.candidates?.[0];
        }

        let msg: dsc.Message | null = null;
        let content: string = '';
        let prefixChecked = false;
        const allPrefixes = [cfg.commands.prefix, ...cfg.commands.alternativePrefixes];

        for await (const part of responseStream.stream) {
            const text = part.text();
            if (!text) continue;
            content += text;

            if (content.trim().length === 0) continue;

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

            if (!msg) {
                msg = await api.reply(payload as dsc.MessageReplyOptions);
            } else {
                try {
                    await msg.edit(payload as dsc.MessageEditOptions);
                } catch {}
            }
        }
    },
};
