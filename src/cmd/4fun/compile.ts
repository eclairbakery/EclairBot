import { cfg } from '@/bot/cfg.ts';
import { Command } from '@/bot/command.ts';
import { CommandFlags } from '@/bot/apis/commands/misc.ts';
import { CommandPermissions } from '@/bot/apis/commands/permissions.ts';
import { output } from '../../bot/logging.ts';

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
            api,
            'Kompiluje twój kod...',
            'Proszę uzbroić się w cierpliwość bo kompilacja jest zasobożerna.',
        );

        const langArg = api.getTypedArg('compiler', 'string')?.value;
        const code = api.getTypedArg('code', 'code').value;
        const stdin = api.getTypedArg('stdin', 'code')?.value;

        const lang = langArg ?? code.lang ?? undefined;
        if (!lang) {
            return msg.edit({
                embeds: [
                    api.log.getErrorEmbed('Błąd!', 'Codeblock musi zawierać język gdy używasz auto.'),
                ],
            });
        }

        const compiler = findCompiler(lang);
        output.log('compiler: ', compiler);
        const apiUrl = 'https://wandbox.org/api/compile.ndjson';

        const requestData = {
            compiler,
            title: '',
            description: '',
            code: code.src,
            codes: [],
            options: '',
            stdin: stdin?.src ?? '',
            'compiler-option-raw': '',
            'runtime-option-raw': '',
        };

        const reply = await (await fetch(apiUrl, {
            method: 'post',
            body: JSON.stringify(requestData),
        })).text();

        if (reply.trim().toLowerCase().includes('error: compiler not found')) {
            return await msg.edit({
                embeds: [
                    api.log.getWarnEmbed(
                        'Kompiler zły dałeś...',
                        `Kompilator \`${langArg}\` nie jest poprawnym kompilatorem na liście.`,
                    ),
                ],
            });
        }

        const base_messages = reply
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
        
        for (const msg of base_messages) {
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
                    api.log.getWarnEmbed('Za długie', 'Result twojego programu jest za długi. Spróbuj podzielić swój kod.'),
                ],
            });
        }

        return await msg.edit({
            embeds: [
                api.log.getSuccessEmbed('Masz ten result czy coś', cmdOutput),
            ],
        });
    },
};
