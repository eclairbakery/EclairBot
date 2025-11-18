import { cfg } from "@/bot/cfg.js";

export type TranslateableObject = {[key: string | number | symbol] : any} | any[];
export type Translateable = TranslateableObject | string | number;

function translateString(what: string) {
    const translation = cfg.features.translations.find((val) => (typeof val.input === 'string') ? (val.input == what) : (val.input.includes(what)));
    if (!translation) return what;
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