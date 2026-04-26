import { Command } from '@/bot/command.ts';
import { CommandFlags } from '@/bot/apis/commands/misc.ts';
import { CommandPermissions } from '@/bot/apis/commands/permissions.ts';
import { getCompilerForLang } from '@/bot/apis/compile/auto.ts';
import { CompilerErrorKind } from '@/bot/apis/compile/driver.ts';

const compileCmd: Command = {
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
            'Chwila...',
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

        const driver = await getCompilerForLang(lang);
        const info = await driver.info();

        if (info.lang === 'unknown') {
            return await msg.edit({
                embeds: [
                    api.log.getWarnEmbed(
                        'Kompiler zły dałeś...',
                        `Kompilator \`${lang}\` nie jest poprawnym kompilatorem na liście.`,
                    ),
                ],
            });
        }

        const footerText = `${info.lang} | ${info.displayName} ${info.version} | ${info.backend}`;
        msg.edit({
            embeds: [
                api.log.getInfoEmbed(
                    'Kompiluje twój kod...',
                    'Proszę uzbroić się w cierpliwość bo kompilacja jest zasobożerna.',
                ).setFooter({ text: footerText }),
            ],
        });

        const result = await driver.compile({
            source: code.src,
            stdin: stdin?.src ?? '',
        });

        if (!result.ok) {
            let title = 'Błąd!';
            let errMsg = result.errMessage;
            if (result.errKind === CompilerErrorKind.Compile) {
                title = 'Błąd kompilacji!';
                errMsg = '```' + errMsg + '```';
            } else if (result.errKind === CompilerErrorKind.Timeout) {
                title = 'Timeout!';
            }

            return await msg.edit({
                embeds: [
                    api.log.getErrorEmbed(title, errMsg)
                        .setFooter({ text: footerText }),
                ],
            });
        }

        let cmdOutput = '';

        if (result.stdout) {
            const lines = result.stdout.trim().split('\n');
            for (const line of lines) {
                if (!line.trim()) continue;
                cmdOutput += `:white_large_square: \`${line.replaceAll('\`', '').trim()}\`\n`;
            }
        }

        if (result.stderr) {
            const lines = result.stderr.trim().split('\n');
            for (const line of lines) {
                if (!line.trim()) continue;
                cmdOutput += `:red_square: \`${line.replaceAll('\`', '').trim()}\`\n`;
            }
        }

        cmdOutput += `:black_large_square: exited with code: \`${result.exitcode}\``;

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

export default compileCmd;
