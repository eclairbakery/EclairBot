import assert from "node:assert";

export function mkDualProgressBar(red: number, green: number, totalLength: number = 8) {
    const maxHalf = totalLength / 2;
    red = Math.min(red, maxHalf);
    green = Math.min(green, maxHalf);

    return '<:dark_red_block:1416021203331715082>'.repeat(maxHalf - red)
        + '<:light_red_block:1416021243379056700>'.repeat(red)
        + '<:light_green_block:1416021218485600357>'.repeat(green)
        + '<:dark_green_block:1416021182964043856>'.repeat(maxHalf - green);
}

export function mkProgressBar(fillLength: number, max: number, totalLength: number = 10) {
    const progress = Math.min(fillLength / max, 1);
    const filledLength = Math.floor(totalLength * progress);
    const emptyLength = totalLength - filledLength;

    return `${'█'.repeat(filledLength)}${'░'.repeat(emptyLength)}`;
}
