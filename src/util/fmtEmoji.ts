import { Emoji } from "@/bot/cfg.js";

export default function fmtEmoji(emoji: Emoji) {
    return `<:${emoji.name}:${emoji.id}>`;
}
