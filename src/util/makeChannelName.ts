import { cfg } from "@/bot/cfg.js";
import { output } from "@/bot/logging.js";

export interface ChannelName { name: string; emoji: string; leaveSpaces?: boolean };

function makeEmojiForChannelName(emoji: string) {
    return `${cfg.legacy.channelsConfiguration.characters.beforeEmoji}${emoji.replace(' ', cfg.legacy.channelsConfiguration.spaceReplacement ?? '-')}${cfg.legacy.channelsConfiguration.characters.afterEmoji}`;
};

export function makeChannelName(data: ChannelName) {
    if (data.emoji.trim().length > 4) {
        output.warn(`Suspicious channel emoji at makeChannelName (data: ${JSON.stringify(data)})`);
    }
    if (data.name.length < 3) {
        output.warn(`Suspicious channel name at makeChannelName (data: ${JSON.stringify(data)})`);
    }
    return `${cfg.legacy.channelsConfiguration.emojiPlacement == 'before-name' ? makeEmojiForChannelName(data.emoji) : '' }${data.name.replace(' ', data.leaveSpaces ? ' ' : (cfg.legacy.channelsConfiguration.spaceReplacement ?? '-'))}${cfg.legacy.channelsConfiguration.emojiPlacement == 'after-name' ? makeEmojiForChannelName(data.emoji) : '' }`;
}