import { cfg } from "@/bot/cfg.js";
import { Command, CommandFlags, CommandPermissions } from "@/bot/command.js";

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
            type: 'string'
        },
        {
            name: 'code',
            description: "No kod.",
            optional: false,
            type: 'trailing-string'
        }
    ],

    async execute(api) {
        let msg = await api.log.replyInfo(
            api, "Kompiluje twój kod...",
            "Proszę uzbroić się w cierpliwość bo kompilacja jest zasobożerna."
        );

        const code = api.getTypedArg('code', 'trailing-string').value!;
        const lang = api.getTypedArg('compiler', 'string').value!;

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
                        'Nie ma takiego compilera...',
                        'Sorki. Naprawimy potem czy cuś. Powiadom o tym administracje serwera.'
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

        let output = 'Masz tu wynik\n\n';

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
                    output += ":fire: exited with code: ";
                    break;
                case "compilermessages":
                case "compilermessagee":
                default: 
                    output += ":diamond_shape_with_a_dot_inside: ";
                    break;
            }

            output += `\`${message.data.replaceAll('\n', ' ').trim()}\`\n`;
        }

        return await msg.edit({
            embeds: [
                api.log.getSuccessEmbed('Masz', output)
            ]
        });
    },
};
