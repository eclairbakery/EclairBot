export default function debugLog(...message: any[]) {
    console.log('DEBUG: ');
    for (const m of message) {
        console.log(m);
    }
}