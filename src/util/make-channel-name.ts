import { cfg } from '@/bot/cfg.ts';
import { output } from '@/bot/logging.ts';

export interface ChannelName {
    name: string;
    emoji: string;
    leaveSpaces?: boolean;
}

function makeEmojiForChannelName(emoji: string) {
    return `${cfg.channels.settings.characters.beforeEmoji}${emoji.replace(' ', cfg.channels.settings.spaceReplacement ?? '-')}${cfg.channels.settings.characters.afterEmoji}`;
}

export function makeChannelName(data: ChannelName) {
    if (data.emoji.trim().length > 4) {
        output.warn(`Suspicious channel emoji at makeChannelName (data: ${JSON.stringify(data)})`);
    }
    if (data.name.length < 3) {
        output.warn(`Suspicious channel name at makeChannelName (data: ${JSON.stringify(data)})`);
    }
    return `${cfg.channels.settings.emojiPlacement == 'before-name' ? makeEmojiForChannelName(data.emoji) : ''}${data.name.replace(' ', data.leaveSpaces ? ' ' : (cfg.channels.settings.spaceReplacement ?? '-'))}${cfg.channels.settings.emojiPlacement == 'after-name' ? makeEmojiForChannelName(data.emoji) : ''}`;
}
