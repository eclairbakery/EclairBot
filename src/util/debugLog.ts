export default function debugLog(...values: any[]) {
    console.log('DEBUG: ');
    for (const v of values) {
        console.log(v);
    }
}