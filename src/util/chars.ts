export type char = string;

export function isValid(ch: char): boolean {
    return ch.length == 1;
}

export function isDigit(ch: char): boolean {
    return ch >= '0' && ch <= '9';
}

export function isAlpha(ch: char): boolean {
    return /^\p{L}$/u.test(ch);
}

export function isAlnum(ch: string): boolean {
    return /^\p{L}$|^\p{N}$/u.test(ch);
}

export function isIdentch(ch: string): boolean {
    return isAlnum(ch) || ch == '_';
}
