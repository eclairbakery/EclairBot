import { prettyPrint } from '@/util/objects/objects.ts';
import process from "node:process";

// deno-lint-ignore no-explicit-any
export default function debugLog(...values: any[]) {
    process.stderr.write('DEBUG: ');
    for (let i = 0; i < values.length; ++i) {
        process.stderr.write(prettyPrint(values[i]));
        if (i != values.length - 1) process.stderr.write(', ');
    }
    process.stderr.write('\n');
}
