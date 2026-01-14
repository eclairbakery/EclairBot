import * as dsc from 'discord.js';

export type BlockCommandsRules = {
    default: 'block';
    allow: dsc.Snowflake[];
} | {
    default: 'allow';
    deny: dsc.Snowflake[];
};

export interface Emoji {
    name: string;
    id: dsc.Snowflake;
};

export interface ConfigEconomyShopItem {
    name: string;
    description: string;
    price: number;
    role: dsc.Snowflake;
}

export interface ConfigTranslation {
    input: string[] | string,
    output: string
};

export interface RegexExpressionDefinition {
    regex: string,
    flags: `i` | undefined
}