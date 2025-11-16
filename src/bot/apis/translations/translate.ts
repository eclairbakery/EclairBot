import { cfg } from "@/bot/cfg.js";

function translate(what: string) {
    const translation = cfg.features.translations.find((val) => (typeof val.input === 'string') ? (val.input == what) : (val.input.includes(what)));
    if (!translation) return what;
    return translation.output;
}

export { translate, translate as t };