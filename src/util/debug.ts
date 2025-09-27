import * as dsclog from '@/bot/dsclog.js';
import util from 'util';

export function mkLog(func: typeof process.stdout.write): (rawtext: any, ...data: any[]) => boolean {
    return function (rawtext: Buffer | any, ...data: any[]): boolean {
        let text: Buffer | string;
        if (!Buffer.isBuffer(rawtext) && typeof rawtext != 'string')
            text = util.format(rawtext as any);
        else
            text = rawtext;
        const initial = Buffer.isBuffer(text) ? text as Buffer : Buffer.from(text, 'utf8');
        const formatted: string[] = data.map(elem => util.format(elem));
        let totalLength = initial.length + formatted.reduce(
            (acc, str) => acc + Buffer.byteLength(str, 'utf8'), 0);
        
        const last: string | Buffer = formatted?.[formatted.length-1] ?? initial;
        const lastChar: string | number = last.at(last.length-1)!;
        const lastCharCodePoint = typeof lastChar == 'string' ? (lastChar as string).codePointAt(0) : lastChar;
        if (lastCharCodePoint != '\n'.codePointAt(0)) totalLength += '\n'.length;


        let buf = Buffer.alloc(totalLength);
        let offset = 0;
        initial.copy(buf, offset);
        offset += initial.length;
        for (const str of formatted) offset += buf.write(str, offset, 'utf8');
        if (lastCharCodePoint != '\n'.codePointAt(0)) buf.write('\n', offset, 'utf8');

        return func(buf);
    }
}

export let log: (rawtext: any, ...data: any[]) => boolean;
export let err: (rawtext: any, ...data: any[]) => boolean;

export function init() {
    log = mkLog(dsclog.getStdoutLogFn());
    err = mkLog(dsclog.getStderrLogFn());
}
