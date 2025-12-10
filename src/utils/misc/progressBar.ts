export function mkProgressBar(fillLength: number, max: number, totalLength: number = 13) {
    const progress = Math.min(fillLength / max, 1);
    const filledLength = Math.floor(totalLength * progress);
    const emptyLength = totalLength - filledLength;

    return `${'█'.repeat(filledLength)}${'░'.repeat(emptyLength)}`;
}
