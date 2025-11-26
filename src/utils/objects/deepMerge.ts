export function deepMerge<T>(base: T, override: Partial<T>): T {
    const result: T = { ...base };
    for (const key in override) {
        const overrideValue = override[key];
        if (overrideValue && typeof overrideValue === 'object' && !Array.isArray(overrideValue)) {
            result[key] = deepMerge(result[key], overrideValue);
        } else if (overrideValue !== undefined) {
            (result as any)[key] = overrideValue;
        }
    }
    return result;
}