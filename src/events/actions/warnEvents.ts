import * as dsc from 'discord.js';

import actionsManager from '@/features/actions/index.js';
export default actionsManager;

export const OnWarnGiven = actionsManager.mkEvent('OnWarnGiven');
export const OnWarnDeleted = actionsManager.mkEvent('OnWarnDeleted');

export interface WarnEventCtx {
    id: number;
    user: dsc.GuildMember;
    moderator?: dsc.Snowflake;
    reason: string;
    points: number;
    previousPoints?: number;
    expiresAt?: number;
};
