import * as dsc from 'discord.js';

import actionsManager from '@/features/actions/index.js';
export default actionsManager;

export const OnWarnGiven = actionsManager.mkEvent('OnWarnGiven');
export const OnWarnDeleted = actionsManager.mkEvent('OnWarnDeleted');

export interface WarnEventCtx {
    id: number;
    user: dsc.GuildMember;
    moderator: dsc.User;
    reason: string;
    points: number;
    duration: number | null;
    expiresAt: number | null;
};
