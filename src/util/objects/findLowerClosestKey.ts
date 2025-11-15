export function findLowerClosestKey(obj: object, num: number) {
    const keys = Object.keys(obj)
        .map(Number) 
        .filter(k => k <= num) 
        .sort((a, b) => b - a); 

    return keys[0] ?? null; 
}