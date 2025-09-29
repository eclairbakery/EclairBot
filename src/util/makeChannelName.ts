import { cfg } from "@/bot/cfg.js";

function makeEmojiForChannelName(emoji: string) {
    return `${cfg.channelsConfiguration.characters.beforeEmoji}${emoji.replace(' ', cfg.channelsConfiguration.spaceReplacement ?? '-')}${cfg.channelsConfiguration.characters.afterEmoji}`;
};

export function makeChannelName(data: { name: string; emoji: string; leaveSpaces?: boolean }) {
    if (data.emoji.length > 1) {
        console.log(`Suspicious channel emoji at makeChannelName (data: ${JSON.stringify(data)})`);
    }
    if (data.name.length < 3) {
        console.log(`Suspicious channel name at makeChannelName (data: ${JSON.stringify(data)})`);
    }
    return `${cfg.channelsConfiguration.emojiPlacement == 'before-name' ? makeEmojiForChannelName(data.emoji) : '' }${data.name.replace(' ', data.leaveSpaces ? ' ' : (cfg.channelsConfiguration.spaceReplacement ?? '-'))}${cfg.channelsConfiguration.emojiPlacement == 'after-name' ? makeEmojiForChannelName(data.emoji) : '' }`;
}