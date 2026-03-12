import { cfg } from "@/bot/cfg.js";

export type TranslateableObject = {[key: string | number | symbol] : any} | any[];
export type Translateable = TranslateableObject | string | number;

function translatePatternToRegex(input: string): { regex: RegExp, groups: number } {
    let escaped = input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    let groups = 0;
    escaped = escaped.replace(/\\\[\\\*\\\*\\\]/g, () => {
        groups++;
        return "(.*)";
    });
    escaped = escaped.replace(/\\\[\\\*\\\]/g, ".*");

    const regex = new RegExp(`^${escaped}$`, "i");

    return { regex, groups };
}

function translateString(what: string) {
    const translation = cfg.features.translations.find((val) => {
        const inputs = typeof val.input === "string" ? [val.input] : val.input;

        return inputs.some((pattern: string) => {
            const { regex } = translatePatternToRegex(pattern);
            return regex.test(what);
        });
    });

    if (!translation) return what;

    const inputs = typeof translation.input === "string" ? [translation.input] : translation.input;

    for (const pattern of inputs) {
        const { regex, groups } = translatePatternToRegex(pattern);
        const match = what.match(regex);

        if (match) {
            let output = translation.output;

            for (let i = 1; i <= groups; i++) {
                output = output.replace(new RegExp(`\\$${i}`, "g"), match[i] ?? "");
            }

            return output;
        }
    }

    return translation.output;
}

function translateObj<T extends TranslateableObject>(what: T): T {
    if (Array.isArray(what)) {
        return what.map(v => translate(v)) as T;
    }

    const output: Record<string, any> = { ...what };

    for (const key of Object.keys(output)) {
        output[key] = translate(output[key]);
    }

    return output as T;
}

function translate(what: string): string;
function translate(what: number): number;
function translate<T extends TranslateableObject>(what: T): T;
function translate(what: Translateable): Translateable {
    switch (typeof what) {
        case "object":
            return translateObj(what);

        case "string":
            return translateString(what);

        case "number":
        case "bigint":
        default:
            return what;
    }
}

export { translate, translate as t };