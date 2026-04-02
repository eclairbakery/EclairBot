import { cfg } from '@/bot/cfg.ts';
import { Command } from '@/bot/command.ts';
import { CommandFlags } from '@/bot/apis/commands/misc.ts';
import { CommandPermissions } from '@/bot/apis/commands/permissions.ts';

interface WandboxCompiler {
    name: string;
    language: string;
    version: string;
    'display-name'?: string;

    'compiler-option-raw'?: boolean;
    'runtime-option-raw'?: boolean;

    switches?: unknown[];
};

function findCompiler(lang: string): string {
    const replaceMap = Object.entries(cfg.features.compilation.replaceCompilerMap);
    const langNormalized = lang.trim().toLowerCase();
    for (const [compiler, aliases] of replaceMap) {
        const compilerNormalized = compiler.toLowerCase();
        if (aliases.includes(langNormalized) || compilerNormalized == langNormalized) {
            return compiler;
        }
    }
    return lang;
}

export const compileCmd: Command = {
    name: 'compile',
    aliases: ['exec-code'],
    flags: CommandFlags.None,
    description: {
        main: 'Tak! Teraz możesz kompilować kod w Javie, Bashu, Julii, C++ czy nawet Go!',
        short: 'Skompiluj kod w swoim ulubionym języku programowania.',
    },
    permissions: CommandPermissions.everyone(),

    expectedArgs: [
        {
            name: 'compiler',
            description: 'Daj file extension albo nazwę języka idk.',
            optional: true,
            type: { base: 'string' },
        },
        {
            name: 'code',
            description: 'No kod.',
            optional: false,
            type: { base: 'code' },
        },
        {
            name: 'stdin',
            description: 'Opcjonalne stdin przekazane do twojego programu',
            optional: true,
            type: { base: 'code' },
        },
    ],

    async execute(api) {
        const msg = await api.log.replyInfo(
            api, 'Chwila...',
            'Przetwarzam dane',
        );

        const langArg = api.getTypedArg('compiler', 'string')?.value;
        const code = api.getTypedArg('code', 'code').value;
        const stdin = api.getTypedArg('stdin', 'code')?.value;

        const lang = langArg ?? code.lang ?? undefined;
        if (!lang) {
            return msg.edit({
                embeds: [
                    api.log.getErrorEmbed(
                        'Błąd!',
                        'Musisz podać w jakim języku jest twój kod, albo jako argument albo na górze codeblocka.',
                    ),
                ],
            });
        }

        const compilerNotFoundError = async () => {
            return await msg.edit({
                embeds: [
                    api.log.getWarnEmbed(
                        'Kompiler zły dałeś...',
                        `Kompilator \`${lang}\` nie jest poprawnym kompilatorem na liście.`,
                    ),
                ],
            });
        };

        const compilerName = findCompiler(lang);
        const apiUrl = 'https://wandbox.org/api/compile.ndjson';

        const res = await fetch("https://wandbox.org/api/list.json");
        const data: WandboxCompiler[] = await res.json();
        
        const compiler = data.find(c => c.name == compilerName);
        if (!compiler) {
            return compilerNotFoundError();
        }

        const footerText = `${compiler.language} | ${compiler['display-name']} ${compiler.version}`;
        msg.edit({
            embeds: [
                api.log.getInfoEmbed(
                    'Kompiluje twój kod...',
                    'Proszę uzbroić się w cierpliwość bo kompilacja jest zasobożerna.',
                ).setFooter({ text: footerText }),
            ],
        });

        const requestData = {
            compiler: compilerName,
            title: '',
            description: '',
            code: code.src,
            codes: [],
            options: '',
            stdin: stdin?.src ?? '',
            'compiler-option-raw': '',
            'runtime-option-raw': '',
        };

        const response = await fetch(apiUrl, {
            method: 'post',
            body: JSON.stringify(requestData),
        });
        const reply = await response.text();

        if (reply.trim().toLowerCase().includes('error: compiler not found')) {
            return compilerNotFoundError();       
        }

        const baseMessages = reply
            .split('\n')
            .map((v) => v.trim())
            .filter(Boolean)
            .map((v) => {
                if (v.startsWith('Error: ')) {
                    v = v.replaceAll('Error: ', '');
                    return { type: 'error', data: v };
                }

                try {
                    return JSON.parse(v);
                } catch {
                    return { type: 'error', data: 'cannot parse as json: ' + v };
                }
            }) as { type: string; data: string }[];

        const messages: { type: string; data: string }[] = [];
        
        for (const msg of baseMessages) {
            const lines = msg.data.split("\n");
            
            for (const line of lines) {
                if (!line.trim()) continue;

                messages.push({ ...msg, data: line });
            }
        }

        let cmdOutput = '';

        for (const message of messages) {
            if (message.type == 'Control') {
                continue;
            }

            switch (message.type.toLowerCase()) {
                case 'stdout':
                    cmdOutput += ':white_large_square: ';
                    break;
                case 'stderr':
                    cmdOutput += ':red_square: ';
                    break;
                case 'signal':
                    cmdOutput += ':green_circle: received signal: ';
                    break;
                case 'error':
                    cmdOutput += ':wilted_rose: error: ';
                    break;
                case 'exitcode':
                    cmdOutput += ':black_large_square: exited with code: ';
                    break;
                case 'compilermessages':
                case 'compilermessagee':
                default:
                    cmdOutput += ':diamond_shape_with_a_dot_inside: ';
                    break;
            }

            cmdOutput += `\`${message.data.replaceAll('\n', ' ').replaceAll('\`', '').trim()}\`\n`;
        }

        if (cmdOutput.length > 1500) {
            return await msg.edit({
                embeds: [
                    api.log.getWarnEmbed('Za długie', 'Result twojego programu jest za długi. Spróbuj podzielić swój kod.')
                        .setFooter({ text: footerText }),
                ],
            });
        }

        return await msg.edit({
            embeds: [
                api.log.getSuccessEmbed('Masz ten result czy coś', cmdOutput)
                    .setFooter({ text: footerText }),
            ],
        });
    },
};
