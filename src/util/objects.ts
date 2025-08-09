export function deepMerge<T>(base: T, override: Partial<T>): T {
    const result: any = { ...base };
    for (const key in override) {
        const overrideValue = override[key];
        if (overrideValue && typeof overrideValue === "object" && !Array.isArray(overrideValue)) {
            result[key] = deepMerge((result as any)[key], overrideValue as any);
        } else if (overrideValue !== undefined) {
            (result as any)[key] = overrideValue;
        }
    }
    return result;
}

export function deepEqual<T>(a: T, b: T): boolean {
    if (a === b) return true;
    if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
        if (!keysB.includes(key) || !deepEqual((a as any)[key], (b as any)[key])) {
            return false;
        }
    }

    return true;
}

export function pretty_print(obj: any): string {
    return JSON.stringify(obj, null, 2);
}