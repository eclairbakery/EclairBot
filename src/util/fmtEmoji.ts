import { Emoji } from "@/bot/definitions/config/subtypes.ts";

export default function fmtEmoji(emoji: Emoji) {
    return `<:${emoji.name}:${emoji.id}>`;
}
