import { client } from '../../client.js';

import sleep from '@/util/sleep.js';

import actionsManager, { Action, UserEventCtx, PredefinedActionEventTypes, PredefinedActionConstraints, PredefinedActionCallbacks, Ok, Skip, MagicSkipAllActions } from '../actions.js';
export default actionsManager;

import * as dsc from 'discord.js';

import { cfg } from '@/bot/cfg.js';
import { watchNewMember } from '@/bot/watchdog.js';

const StartItId = '572906387382861835';

export const welcomeNewUserAction: Action<UserEventCtx> = {
    activationEventType: PredefinedActionEventTypes.OnUserJoin,
    constraints: [
        () => cfg.general.welcomer.enabled ? Ok : Skip,
    ],
    callbacks: [
        async (member) => {
            if (await watchNewMember(member) == 'kicked') return MagicSkipAllActions;

            const welcomeChannel = await client.channels.fetch(cfg.general.welcomer.channelId);
            if (welcomeChannel == null || !welcomeChannel.isSendable()) return;

            const generalChannel = await client.channels.fetch(cfg.general.welcomer.general);
            if (generalChannel == null || !generalChannel.isSendable()) return;

            if (member.user.id == StartItId) {
                await welcomeChannel.send('Spierdalaj ty zjebie podludzki start it nikt cię tu nie chce');
                return;
            }

            await welcomeChannel.send('<:emoji1:1410551894023082027>' + (cfg.general.welcomer.welcomeMsgs[Math.floor(Math.random() * cfg.general.welcomer.welcomeMsgs.length)]).replace('<mention>', cfg.general.welcomer.mentionNewPeopleInLobby ? `<@${member.user.id}>` : member.user.username));
            await generalChannel.send(`witaj <@${member.user.id}>, będzie nam miło jak się przywitasz czy coś <:emoji_a_radosci_nie_bylo_konca:1376664467416420362>`);
        }
    ],
}

export const sayGoodbyeAction: Action<UserEventCtx> = { 
    activationEventType: PredefinedActionEventTypes.OnUserQuit,
    constraints: [
        () => cfg.general.welcomer.enabled ? Ok : Skip,
    ],
    callbacks: [
        async (member) => {
            const channel = await client.channels.fetch(cfg.general.welcomer.channelId);
            if (!channel?.isSendable()) return;

            if (member.user.id == StartItId) {
                await channel.send('I dobrze, i tak nikt cię nie lubił start it!');
                return;
            }

            await channel.send('<:emoji2:1410551857935290368>' + (cfg.general.welcomer.goodbyeMsgs[Math.floor(Math.random() * cfg.general.welcomer.goodbyeMsgs.length)]).replace('<mention>', cfg.general.welcomer.mentionNewPeopleInLobby ? `<@${member.user.id}>` : member.user.username));
        }
    ],
};
