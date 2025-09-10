import { client } from '../../client.js';

import sleep from '@/util/sleep.js';

import actionsManager, { Action, UserEventCtx, PredefinedActionEventTypes, PredefinedActionConstraints, PredefinedActionCallbacks, Ok, Skip } from '../actions.js';
export default actionsManager;

import * as dsc from 'discord.js';

import { cfg } from '@/bot/cfg.js';

const StartItId = '572906387382861835';

export const welcomeNewUserAction: Action<UserEventCtx> = {
    activationEventType: PredefinedActionEventTypes.OnUserJoin,
    constraints: [
        (_member) => cfg.general.welcomer.enabled ? Ok : Skip,
    ],
    callbacks: [
        async (member) => {
            const welcomeChannel = await client.channels.fetch(cfg.general.welcomer.channelId);
            if (welcomeChannel == null || !welcomeChannel.isSendable()) return;

            const generalChannel = await client.channels.fetch(cfg.general.welcomer.general);
            if (generalChannel == null || !generalChannel.isSendable()) return;

            if (member.user.id == StartItId) {
                await welcomeChannel.send('Spierdalaj ty zjebie podludzki start it nikt cię tu nie chce');
                return;
            }

            const messages = [
                `Witaj szanowny użytkowniku ${member.user.username}!`,
                `Siema, ale przystojny jesteś ${member.user.username} ngl`,
                `Kocham cię ${member.user.username}`,
                `C-cczęsto masz tak na imie ${member.user.username}?`,
                `nie chce mi się, ${member.user.username}`
            ];

            await welcomeChannel.send('<:emoji1:1410551894023082027>' + messages[Math.floor(Math.random() * messages.length)]);
            await generalChannel.send(`witaj <@${member.user.id}>, będzie nam miło jak się przywitasz czy coś <:emoji_a_radosci_nie_bylo_konca:1376664467416420362>`);
        }
    ],
}

export const sayGoodbyeAction: Action<UserEventCtx> = {
    activationEventType: PredefinedActionEventTypes.OnUserQuit,
    constraints: [
        (_member) => cfg.general.welcomer.enabled ? Ok : Skip,
    ],
    callbacks: [
        async (member) => {
            const channel = await client.channels.fetch(cfg.general.welcomer.channelId);
            if (!channel.isSendable()) return;

            if (member.user.id == StartItId) {
                await channel.send('I dobrze, i tak nikt cię nie lubił start it!');
                return;
            }

            const messages = [
                `Do widzenia ${member.user.username}!`,
                `Żegnaj ${member.user.username}, będziemy za tobą tęsknić! (chyba)`,
                `${member.user.username} opuścił nasz serwer, ale zawsze może wrócić! (nie wróci)`,
            ];

            await channel.send('<:emoji2:1410551857935290368>' + messages[Math.floor(Math.random() * messages.length)]);
        }
    ],
};
