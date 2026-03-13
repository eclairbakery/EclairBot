import suffixes from './num-suffixes.js';

export class NumberParseError extends Error {
    constructor(message: string) { super(message); }
}

export function parseNumber(input: string): number {
    const cleaned = input.trim().replace(/\s/g, '').replace(',', '.');
    if (!cleaned) throw new NumberParseError('Input is empty');

    let multiplier = 1;
    let numberPart = cleaned;

    for (const { limit, suffix } of suffixes) {
        if (cleaned.endsWith(suffix)) {
            multiplier = Number(limit);
            numberPart = cleaned.slice(0, -suffix.length);
            break;
        }
    }

    const value = parseFloat(numberPart);
    if (isNaN(value)) throw new NumberParseError(`Invalid number format: ${numberPart}`);

    return value * multiplier;
}

export function parseBigint(input: string, decimals: number): bigint {
    let cleaned = input.trim().replace(/\s/g, '');
    if (!cleaned) throw new NumberParseError('Input is empty');

    const isNegative = cleaned.startsWith('-');
    if (isNegative) cleaned = cleaned.slice(1);

    let scale: bigint | null = null;
    let numberPart = cleaned;

    for (const { limit, suffix } of suffixes) {
        if (cleaned.endsWith(suffix)) {
            scale = limit;
            numberPart = cleaned.slice(0, -suffix.length);
            break;
        }
    }

    const base = 10n ** BigInt(decimals);
    const finalScale = scale === null ? base : scale * base;

    const [wholeStr, fractionalStr] = numberPart.split(',');
    
    let value = 0n;
    if (wholeStr) {
        try {
            value = BigInt(wholeStr) * finalScale;
        } catch {
            throw new NumberParseError(`Invalid integer part: ${wholeStr}`);
        }
    } else if (!fractionalStr) {
        throw new NumberParseError('Invalid number format');
    }

    if (fractionalStr) {
        try {
            const power = BigInt(fractionalStr.length);
            const fractionValue = BigInt(fractionalStr);
            value += (fractionValue * finalScale) / (10n ** power);
        } catch {
            throw new NumberParseError(`Invalid fractional part: ${fractionalStr}`);
        }
    }

    return isNegative ? -value : value;
}
