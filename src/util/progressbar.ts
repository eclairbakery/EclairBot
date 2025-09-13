import assert from "node:assert";
import fmtEmoji from "./fmtEmoji.js";
import { cfg } from "@/bot/cfg.js";
import debugLog from "./debugLog.js";

export function mkDualProgressBar(red: number, green: number, totalLength: number = 10) {
    const maxHalf = totalLength / 2;
    red = Math.min(red, maxHalf);
    green = Math.min(green, maxHalf);
    debugLog({ red, green });

    return fmtEmoji(cfg.emoji.darkRedBlock).repeat(maxHalf - red)
        + fmtEmoji(cfg.emoji.lightRedBlock).repeat(red)
        + fmtEmoji(cfg.emoji.lightGreenBlock).repeat(green)
        + fmtEmoji(cfg.emoji.darkGreenBlock).repeat(maxHalf - green);
}

export function mkProgressBar(fillLength: number, max: number, totalLength: number = 13) {
    const progress = Math.min(fillLength / max, 1);
    const filledLength = Math.floor(totalLength * progress);
    const emptyLength = totalLength - filledLength;

    return `${'█'.repeat(filledLength)}${'░'.repeat(emptyLength)}`;
}
