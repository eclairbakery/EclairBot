import util from 'node:util';

export function prettyPrint(obj: any): string {
    return util.inspect(obj, { colors: true, depth: null });
}