import { Color, PredefinedColors } from '@/util/color.js';
import * as dsc from 'discord.js';

export type money = number;

export type ConfigEconomyCond =
    | { op: 'has-role', roleId: string }
    | { op: 'has-item', itemId: string }
    | { op: 'money-gte', amount: money }
    | { op: 'money-lte', amount: money }
    | { op: 'random-chance', chance: number };

export interface ConfigEconomyRandomVariant {
    weight?: number;
    actions: ConfigEconomyAction[];
}

// roleId = config role id (ConfigEconomyRole.id), not discord id (!)
export type ConfigEconomyAction =
    | { op: 'add-item', itemId: string }
    | { op: 'rem-item', itemId: string }
    | { op: 'add-role', roleId: string }
    | { op: 'rem-role', roleId: string }
    | { op: 'add-money', amount: money }
    | { op: 'sub-money', amount: money }
    
    | { op: 'random', variants: ConfigEconomyRandomVariant[] }
    
    | { op: 'if', cond: ConfigEconomyCond,
        then: ConfigEconomyAction[],
        else?: ConfigEconomyAction[], 
    }
    | { op: 'while', cond: ConfigEconomyCond,
        do: ConfigEconomyAction[],
        maxIterations?: number, // by default: 100
    };

export type ConfigEconomyMultiplierKind = 'work' | 'slut' | 'crime';
export type ConfigEconomyMultiplierFilter = ConfigEconomyMultiplierKind[] | '*';

export interface ConfigEconomyMultiplier {
    filter: ConfigEconomyMultiplierFilter;
    multiplier: number;
};

export interface ConfigEconomyRoleBenefits {
    multipliers: ConfigEconomyMultiplier[];
    dailyIncome: ConfigEconomyAction[];
};

export interface ConfigEconomyThing {
    id: string;
    name: string;
    desc: string;
};

export interface ConfigEconomyRole extends ConfigEconomyThing {
    discordRoleId: dsc.Snowflake;
    benefits: ConfigEconomyRoleBenefits;
};

export interface ConfigEconomyItem extends ConfigEconomyThing {
    price: money;
    onUse: ConfigEconomyAction[]; // for example: add-role/add-money
};

export interface ConfigEconomyShopOffer extends ConfigEconomyThing {
    price: money;
    onBuy: ConfigEconomyAction[]; // for example: add-item
};


export interface ConfigEconomyShopCategory {
    id: string;
    name: string;
    desc: string;
    emoji: string;
    color: Color;
    items: string[]; // offer IDs
};

// ----- config ----- // 
export default interface EconomyConfig {
    currencySign: string;
    currencySignPlacement: 'left' | 'right';

    roles: ConfigEconomyRole[];
    items: ConfigEconomyItem[];
    offers: ConfigEconomyShopOffer[];
    shop: ConfigEconomyShopCategory[];
};
