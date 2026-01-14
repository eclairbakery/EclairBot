import { Emoji } from "@/bot/definitions/config-subtypes.js";

export default function fmtEmoji(emoji: Emoji) {
    return `<:${emoji.name}:${emoji.id}>`;
}
