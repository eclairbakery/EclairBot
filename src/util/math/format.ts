import { cfg } from '@/bot/cfg.js';

export type Money = number;

export function formatNumber(value: number): string {
    const abs = Math.abs(value);
    const suffixes = [
        { limit: 1_000_000_000, suffix: ", w skrócie to W CHUJ" }, // easter egg 😈
        { limit: 1_000_000_000, suffix: "B" },
        { limit: 1_000_000,     suffix: "M" },
        { limit: 1_000,         suffix: "k" },
    ];

    for (const { limit, suffix } of suffixes) {
        if (abs >= limit) {
            const scaled = value / limit;
            const rounded =
              scaled >= 100
                ? Math.round(scaled).toString()
                : scaled >= 10
                ? scaled.toFixed(1)
                : scaled.toFixed(2);

            return rounded.replace(".", ",") + suffix;
        }
    }

    const rounded
        = abs >= 100
        ? Math.round(value).toString()
        : abs >= 10
        ? value.toFixed(1)
        : value.toFixed(2);

    return rounded.replace(".", ",");
}

export function formatMoney(money: Money): string {
    switch (cfg.features.economy.currencySignPlacement) {
    case 'left':
        return cfg.features.economy.currencySign + formatNumber(money satisfies number);
    case 'right':
        return formatNumber(money satisfies number) + cfg.features.economy.currencySign;
    }
}
