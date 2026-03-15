import suffixes from "./num-suffixes.ts";

export function formatNumber(value: number): string {
    const abs = Math.abs(value);

    for (const { limit, suffix } of suffixes) {
        if (abs >= limit) {
            const scaled = value / Number(limit);
            const rounded = scaled >= 100 ? Math.round(scaled).toString() : scaled >= 10 ? scaled.toFixed(1) : scaled.toFixed(2);

            return rounded.replace(".", ",") + suffix;
        }
    }

    const rounded = abs >= 100 ? Math.round(value).toString() : abs >= 10 ? value.toFixed(1) : value.toFixed(2);

    return rounded.replace(".", ",");
}

export function formatBigint(value: bigint, decimals: number): string {
    const base = 10n ** BigInt(decimals);

    const sign = value < 0n ? "-" : "";
    const abs = value < 0n ? -value : value;

    const whole = abs / base;
    const fraction = abs % base;

    function formatScaled(intPart: bigint, remainder: bigint, scale: bigint) {
        if (intPart >= 100n) {
            return intPart.toString();
        }

        if (intPart >= 10n) {
            const decimal = (remainder * 10n) / scale;
            return `${intPart},${decimal}`;
        }

        const decimal = (remainder * 100n) / scale;
        const d = decimal.toString().padStart(2, "0");
        return `${intPart},${d}`;
    }

    for (const { limit, suffix } of suffixes) {
        if (whole >= limit) {
            const scaled = whole;
            const intPart = scaled / limit;
            const remainder = scaled % limit;

            return sign + formatScaled(intPart, remainder, limit) + suffix;
        }
    }

    const intPart = whole;
    const remainder = fraction;

    return sign + formatScaled(intPart, remainder, base);
}

//export function formatMoney(money: Money): string {
//    switch (cfg.features.economy.currencySignPlacement) {
//    case 'left':
//        return cfg.features.economy.currencySign + formatNumber(money satisfies number);
//    case 'right':
//        return formatNumber(money satisfies number) + cfg.features.economy.currencySign;
//    }
//}
