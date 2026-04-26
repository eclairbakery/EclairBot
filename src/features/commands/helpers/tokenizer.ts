import { ParsedRawArgument } from './argument-parser.ts';

export class CommandTokenizer {
    private pos: number;
    private content: string;

    constructor(content: string) {
        this.content = content;
        this.pos = 0;
    }

    public tokenize(): ParsedRawArgument[] {
        const args: ParsedRawArgument[] = [];

        while (this.pos < this.content.length) {
            const wsStart = this.pos;
            this.skipWhitespace();
            const precedingWhitespace = this.content.slice(wsStart, this.pos);

            if (this.pos >= this.content.length) break;

            if (this.content.startsWith('```', this.pos)) {
                args.push(this.readTripleBacktickBlock(precedingWhitespace));
            } else if (this.content[this.pos] == '`') {
                args.push(this.readSingleBacktickBlock(precedingWhitespace));
            } else if (this.content[this.pos] == '"') {
                args.push(this.readQuotedString(precedingWhitespace));
            } else {
                args.push(this.readUnquotedString(precedingWhitespace));
            }
        }

        return args;
    }

    private skipWhitespace() {
        while (this.pos < this.content.length && /\s/.test(this.content[this.pos])) {
            this.pos++;
        }
    }

    private readTripleBacktickBlock(precedingWhitespace: string): ParsedRawArgument {
        this.pos += '```'.length;
        const contentStart = this.pos;
        let end = this.content.indexOf('```', this.pos);

        if (end == -1) end = this.content.length;

        let block = this.content.slice(contentStart, end);
        this.pos = end + (end < this.content.length ? 3 : 0);

        let lang: string | undefined = undefined;
        const firstLineEnd = block.indexOf('\n');
        const firstSpace = block.search(/\s/);

        let breakPoint = -1;
        if (firstLineEnd != -1 && (firstSpace == -1 || firstLineEnd < firstSpace)) {
            breakPoint = firstLineEnd;
        } else {
            breakPoint = firstSpace;
        }

        if (breakPoint != -1) {
            const potentialLang = block.slice(0, breakPoint).trim();
            if (potentialLang && /^\w+$/.test(potentialLang)) {
                lang = potentialLang;
                block = block.slice(breakPoint).trimStart();
            }
        }

        return { type: 'code', value: block, lang, precedingWhitespace };
    }

    private readSingleBacktickBlock(precedingWhitespace: string): ParsedRawArgument {
        this.pos++;
        const contentStart = this.pos;
        const end = this.content.indexOf('`', this.pos);

        if (end == -1) {
            const val = this.content.slice(contentStart);
            this.pos = this.content.length;
            return { type: 'code', value: val, precedingWhitespace };
        }

        const val = this.content.slice(contentStart, end);
        this.pos = end + 1;
        return { type: 'code', value: val, precedingWhitespace };
    }

    private readQuotedString(precedingWhitespace: string): ParsedRawArgument {
        this.pos++;
        const contentStart = this.pos;
        const end = this.content.indexOf('"', this.pos);

        if (end == -1) {
            const val = this.content.slice(contentStart);
            this.pos = this.content.length;
            return { type: 'text', value: val, precedingWhitespace };
        }

        const val = this.content.slice(contentStart, end);
        this.pos = end + 1;
        return { type: 'text', value: val, precedingWhitespace };
    }

    private readUnquotedString(precedingWhitespace: string): ParsedRawArgument {
        const start = this.pos;
        while (this.pos < this.content.length && !/\s/.test(this.content[this.pos])) {
            this.pos++;
        }
        const val = this.content.slice(start, this.pos);
        return { type: 'text', value: val, precedingWhitespace };
    }
}
