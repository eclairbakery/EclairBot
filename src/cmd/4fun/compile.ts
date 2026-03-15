import { cfg } from "@/bot/cfg.ts";
import { Command} from "@/bot/command.ts";
import { CommandFlags } from '@/bot/apis/commands/misc.ts';
import { CommandPermissions } from '@/bot/apis/commands/permissions.ts';
import { CommandAPI } from '@/bot/apis/commands/api.ts';

export const compileCmd: Command = {
    name: "compile",
    aliases: [
        "exec-code"
    ],
    flags: CommandFlags.None,
    description: {
        main: "Tak! Teraz możesz kompilować kod w Javie, Bashu, Julii, C++ czy nawet Go!",
        short: "Skompiluj kod w swoim ulubionym języku programowania."
    },
    permissions: CommandPermissions.everyone(),

    expectedArgs: [
        {
            name: 'compiler',
            description: "Daj file extension albo nazwę języka idk.",
            optional: false,
            type: { base: 'string' }
        },
        {
            name: 'code',
            description: "No kod.",
            optional: false,
            type: { base: 'string', trailing: true }
        }
    ],

    async execute(api) {
        let msg = await api.log.replyInfo(
            api, "Kompiluje twój kod...",
            "Proszę uzbroić się w cierpliwość bo kompilacja jest zasobożerna."
        );

        let code = api.getTypedArg('code', 'string').value!;
        let lang = api.getTypedArg('compiler', 'string').value!;

        const trimmed = code.trim();
        const is_codeblock = trimmed.startsWith('```') && trimmed.endsWith('```');

        if (is_codeblock) {
            let inner = trimmed.slice(3, -3);
            const lines = inner.split('\n');
            const first = lines.shift() ?? '';

            if (lang === 'auto') {
                if (!first.trim())
                    return msg.edit({
                        embeds: [
                            api.log.getErrorEmbed('Błąd!', 'Codeblock musi zawierać język gdy używasz auto.')
                        ]
                    });
                lang = first.trim();
            }

            if (first.trim() && lang !== 'auto')
                code = lines.join('\n').trim();
            else
                code = inner.trim();
        } else if (lang === 'auto') {
            return msg.edit({
                embeds: [
                    api.log.getErrorEmbed('Błąd!', 'Nie możesz używać auto jako lang, kiedy nie dajesz codeblocka.')
                ]
            });
        }

        const compiler = cfg.features.compilation.replaceCompilerMap[lang] ?? lang;

        const api_url = 'https://wandbox.org/api/compile.ndjson';

        const request_data = {
            compiler,
            title: "",
            description: "",
            code,
            // there are now things i don't understand, but
            // i probably have to pass to make a valid
            // request to the API
            "codes": [],
            "options": "",
            "stdin": "",
            "compiler-option-raw": "",
            "runtime-option-raw": ""
        };

        const reply = await (await fetch(api_url, {
            method: "post",
            body: JSON.stringify(request_data)
        })).text();

        if (reply.trim().toLowerCase() == 'error: compiler not found')
            return await msg.edit({
                embeds: [
                    api.log.getWarnEmbed(
                        'Kompiler zły dałeś...',
                        'Sorki. Naprawimy potem czy cuś. Powiadom o tym administracje serwera.\n**Jeżeli używasz multi-line kodu, upewnij się, że pierwsza jego linia lub start codeblock\'u jest w tej samej linijce co język**, bo inaczej coś się sypie.'
                    )
                ]
            });

        const messages = reply
            .split('\n')
            .map((v) => v.trim())
            .filter(Boolean)
            .map((v) => {
                if (v.startsWith('Error: ')) {
                    v = v.replaceAll('Error: ', '');
                    return { type: "error", data: v };
                }

                try {
                    return JSON.parse(v)
                } catch {
                    return { type: "error", data: "cannot parse as json: " + v };
                }
            }) as {type: string, data: string}[];

        let output = 'Masz tu wynik, paniczu, ciesz się pan:\n\n';

        for (const message of messages) {
            if (message.type == "Control")
                continue;

            switch (message.type.toLowerCase()) {
                case "stdout":
                    output += ":white_large_square: ";
                    break;
                case "stderr":
                    output += ":red_square: ";
                    break;
                case "signal":
                    output += ":green_circle: received signal: ";
                    break;
                case "error":
                    output += ":wilted_rose: error: ";
                    break;
                case "exitcode":
                    output += ":black_large_square: exited with code: ";
                    break;
                case "compilermessages":
                case "compilermessagee":
                default:
                    output += ":diamond_shape_with_a_dot_inside: ";
                    break;
            }

            output += `\`${message.data.replaceAll('\n', ' ').replaceAll('\`', '').trim()}\`\n`;
        };

        if (output.length > 1500) {
            return await msg.edit({
                embeds: [
                    api.log.getWarnEmbed('Za długie', 'Result twojego programu jest za długi. Spróbuj podzielić swój kod.')
                ]
            });
        }

        return await msg.edit({
            embeds: [
                api.log.getSuccessEmbed('Proszę bardzo', output)
            ]
        });
    },
};
