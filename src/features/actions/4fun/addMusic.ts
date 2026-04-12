import { cfg } from '@/bot/cfg.ts';
import actionsManager, { Action, MessageEventCtx, PredefinedActionEventTypes } from '../index.ts';
export default actionsManager;

import * as dsc from 'discord.js';
import { extractMediaLinks } from '@/features/scan-for-music.ts';
import { db } from '@/bot/apis/db/bot-db.ts';

export const addMusicAction: Action<MessageEventCtx> = {
    activationEventType: PredefinedActionEventTypes.OnMessageCreateOrEdit,
    constraints: [
        (msg: dsc.Message) => {
            if (msg.author.bot) return false;
            if (msg.channelId !== cfg.channels.other.music) return false;
            return true;
        },
    ],
    callbacks: [
        async (msg: dsc.Message) => {
            const links = extractMediaLinks(msg.content);

            for (const link of links) {
                db.music.addEntry(msg.id, link);
            }
        },
    ],
};
