import assert from "node:assert";
import fmtEmoji from "./fmtEmoji.js";
import { cfg } from "@/bot/cfg.js";

export function mkDualProgressBar(red: number, green: number, totalLength: number = 10) {
    const maxHalf = totalLength / 2;
    red = Math.min(red, maxHalf);
    green = Math.min(green, maxHalf);

    return fmtEmoji(cfg.legacy.emoji.darkRedBlock).repeat(maxHalf - red)
        + fmtEmoji(cfg.legacy.emoji.lightRedBlock).repeat(red)
        + fmtEmoji(cfg.legacy.emoji.lightGreenBlock).repeat(green)
        + fmtEmoji(cfg.legacy.emoji.darkGreenBlock).repeat(maxHalf - green);
}

export function mkProgressBar(fillLength: number, max: number, totalLength: number = 13) {
    const progress = Math.min(fillLength / max, 1);
    const filledLength = Math.floor(totalLength * progress);
    const emptyLength = totalLength - filledLength;

    return `${'█'.repeat(filledLength)}${'░'.repeat(emptyLength)}`;
}
