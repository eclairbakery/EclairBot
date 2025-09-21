import * as log from '@/util/log.js';
import * as dsc from 'discord.js';
import * as chars from '@/util/chars.js';

import { Command, CommandFlags } from '@/bot/command.js';

import figlet from 'figlet';
import debugLog from '@/util/debugLog.js';

function tokenize(input: string): string[] {
    let result: string[] = [];
    let current: string = '';
    for (const char of input) {
        if (chars.isIdentch(char)) {
            current += char;
        } else {
            result.push(current);
            result.push(char);
            current = '';
        }
    }
    if (current != '') result.push(current);
    return result;
}

function renderFiglet(text: string, font: string = 'Standard'): Promise<string> {
    return new Promise((resolve, reject) => {
        figlet.text(text, { font }, (err, result) => {
            if (err || !result) reject(err);
            else resolve(result);
        });
    });
}

function figletFonts(): Promise<string[]> {
    return new Promise((resolve, reject) => {
        figlet.fonts((err, fonts) => {
            if (err || !fonts) reject(err);
            else resolve(fonts);
        });
    });
}

function fmtArr(arr: string[]): string {
    let result: string = '';
    for (let i = 0; i < arr.length - 1; ++i) {
        result += `\`${arr[i]}\``;
    }
    result += `lub \`${arr[arr.length - 1]}\``;
    return result;
}

function renderWord(word: string, font: string = 'Standard') {
    return figlet.textSync(word, { horizontalLayout: 'full', font }).split('\n');
}

function concatAsciiLine(lineA: string[], lineB: string[]): string[] {
    const maxLen = Math.max(lineA.length, lineB.length);
    const a = [...lineA, ...Array(maxLen - lineA.length).fill('')];
    const b = [...lineB, ...Array(maxLen - lineB.length).fill('')];
    return a.map((row, i) => row + ' ' + b[i]);
}

function asciiWidth(asciiBlock: string[]) {
    return Math.max(...asciiBlock.map((line) => line.length));
}

function renderFigletWrapped(words: string[], font: string, maxWidth: number = 40): string[][] {
    const lines: string[][] = [];
    let currentLine: string[] = [];

    const flushLine = () => {
        if (currentLine.length > 0 && asciiWidth(currentLine) > 0) {
            lines.push(currentLine);
        }
        currentLine = [];
    };

    const addToLine = (block: string[]) => {
        if (asciiWidth(block) > maxWidth) {
            flushLine();
            lines.push(block);
            return;
        }
        if (currentLine.length === 0) {
            currentLine = block;
            return;
        }
        const testLine = concatAsciiLine(currentLine, block);
        if (asciiWidth(testLine) > maxWidth) {
            flushLine();
            currentLine = block;
        } else {
            currentLine = testLine;
        }
    };

    for (const word of words) {
        if (!word) continue;
        debugLog(word);
        const renderedWord = renderWord(word, font);
        if (asciiWidth(currentLine.concat(renderedWord)) > maxWidth) {
            if (asciiWidth(renderedWord) <= maxWidth) {
                flushLine();
                addToLine(renderedWord);
                continue;
            }

            const letters = word.split('');
            debugLog(letters);
            for (const letter of letters) {
                const renderedLetter = renderWord(letter, font);
                addToLine(renderedLetter);
            }
        } else {
            addToLine(renderedWord);
        }
    }

    flushLine();
    return lines;
}

function renderFigletWrappedString(words: string[], font: string = 'Standard', maxWidth: number = 40): string {
    const blocks = renderFigletWrapped(words, font, maxWidth);
    return blocks.map((block) => block.join('\n')).join('\n\n');
}

export const figletCmd: Command = {
    name: 'figlet',
    aliases: ['render-ascii-text'],
    description: {
        main: 'Ta komenda renderuje ci taki fajny ascii text, podobnie do terminalowej komendy `figlet`.',
        short: 'Renderuje tekst jako ascii art',
    },
    flags: CommandFlags.Spammy,

    expectedArgs: [
        //{
        //    name: 'font',
        //    description: 'Czcionka jakiej chcesz użyć. Możesz wybrać: ' + fmtArr(await figletFonts()) + '.',
        //    type: 'string',
        //    optional: true,
        //},
        {
            name: 'text',
            description: 'Tekst który chcesz wyrenderować',
            type: 'trailing-string',
            optional: false,
        },
    ],
    permissions: {
        allowedUsers: null,
        allowedRoles: null,
        discordPerms: null,
        worksInDM: true,
    },

    async execute(api) {
        const font = /*api.getArg('font').value as string ??*/ 'Standard';
        const text = api.getArg('text').value as string;

        const availableFonts = await figletFonts();
        if (!availableFonts.includes(font)) {
            return log.replyError(
                api.msg,
                'Nieznana czcionka!',
                `Nie znam czionki o nazwie ${font}.\n**Spróbuj tak:** ${fmtArr(availableFonts)}`,
            );
        }

        const words = tokenize(text);
        const result = renderFigletWrappedString(words, font, 40);

        return api.msg.reply({
            embeds: [new dsc.EmbedBuilder().setTitle('Wynik').setDescription(`\`\`\`${result}\`\`\``)],
        });
    },
};
