import { cfg } from '@/bot/cfg.ts';
import { formatBigint } from './math/format.ts';
import { parseBigint } from './math/parse.ts';

export default class Money {
    static readonly SCALE = 100n;
    static readonly DECIMALS = 2;

    private value: bigint;
    
    private constructor(value: bigint) {
        this.value = value;
    }

    static fromCents(value: bigint | number): Money {
        return new Money(BigInt(value));
    }
    static fromDollars(value: bigint | number): Money {
        return new Money(BigInt(value) * Money.SCALE);
    }

    static fromDollarsFloat(float: number): Money {
        if (isNaN(float)) return Money.zero();
        return new Money(BigInt(Math.round(float * Number(Money.SCALE))));
    }

    static fromCentsFloat(float: number): Money {
        if (isNaN(float)) return Money.zero();
        return new Money(BigInt(Math.round(float)));
    }

    static zero(): Money {
        return new Money(0n);
    }
    static parse(input: string): Money {
        let cleaned = input.trim();
        const sign = cfg.features.economy.currencySign;
        const placement = cfg.features.economy.currencySignPlacement;

        if (placement == 'left' && cleaned.startsWith(sign)) {
            cleaned = cleaned.slice(sign.length).trim();
        } else if (placement == 'right' && cleaned.endsWith(sign)) {
            cleaned = cleaned.slice(0, -sign.length).trim();
        }

        return new Money(parseBigint(cleaned, Money.DECIMALS));
    }

    add(other: Money): Money {
        return new Money(this.value + other.value);
    }
    sub(other: Money): Money {
        return new Money(this.value - other.value);
    }
    mul(factor: number | bigint): Money {
        return new Money(this.value * BigInt(factor));
    }
    div(divisor: number | bigint): Money {
        return new Money(this.value / BigInt(divisor));
    }

    clone(): Money {
        return new Money(this.value);
    }

    toJSON(): string {
        return this.value.toString();
    }

    negate(): Money {
        return new Money(-this.value);
    }
    abs(): Money {
        return new Money(this.value < 0n ? -this.value : this.value);
    }

    asCents(): bigint {
        return this.value;
    }
    asCentsFloat(): number {
        return Number(this.value);
    }
    asDollarsFloat(): number {
        return Number(this.value) / Number(Money.SCALE);
    }

    compare(other: Money): number {
        if (this.value < other.value) return -1;
        if (this.value > other.value) return 1;
        return 0;
    }
    equals(other: Money): boolean {
        return this.value == other.value;
    }

    lessThan(other: Money): boolean {
        return this.value < other.value;
    }
    lessThanOrEqual(other: Money): boolean {
        return this.value <= other.value;
    }

    greaterThan(other: Money): boolean {
        return this.value > other.value;
    }
    greaterThanOrEqual(other: Money): boolean {
        return this.value >= other.value;
    }

    isZero(): boolean { return this.value == 0n; }
    isPositive(): boolean { return this.value > 0n; }
    isNegative(): boolean { return this.value < 0n; }

    format(): string {
        const formatted = formatBigint(this.value, Money.DECIMALS);
        switch (cfg.features.economy.currencySignPlacement) {
        case 'left':
            return cfg.features.economy.currencySign + formatted;
        case 'right':
            return formatted + cfg.features.economy.currencySign;
        }
    }

    toString(): string {
        return this.format();
    }
};
