import { client } from '../../client.js';

import sleep from '../../util/sleep.js';

import actionsManager, { Action, UserEventCtx, PredefinedActionEventTypes, PredefinedActionConstraints, PredefinedActionCallbacks, Ok, Skip } from '../actions.js';
export default actionsManager;

import * as dsc from 'discord.js';

import { cfg } from '../../bot/cfg.js';


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

            const messages = [
                `<:emoji1:1410551894023082027> Siema, ale przystojny jesteś ${member.user.username} ngl`,
                `<:emoji1:1410551894023082027> Kocham cię ${member.user.username}`,
                `<:emoji1:1410551894023082027> C-cczęsto masz tak na imie ${member.user.username}?`,
                `<:emoji1:1410551894023082027> nie chce mi się, ${member.user.username}`
            ];

            await welcomeChannel.send(messages[Math.floor(Math.random() * messages.length)]);
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
            await channel.send(`<:emoji2:1410551857935290368> do widzenia ${member.user.username} 🥀 już zmieniłem zdanie nie jesteś przystojny`);
        }
    ],
};
