import { client } from '../../../client.js';

import sleep from '@/util/sleep.js';

import actionsManager, { Action, UserEventCtx, PredefinedActionEventTypes, PredefinedActionConstraints, PredefinedActionCallbacks, Ok, Skip, MagicSkipAllActions } from '../index.js';
export default actionsManager;

import * as dsc from 'discord.js';

import { cfg } from '@/bot/cfg.js';
import { watchNewMember } from '@/bot/watchdog.js';
import { output } from '@/bot/logging.js';

const StartItId = '572906387382861835';

export const welcomeNewUserAction: Action<UserEventCtx> = {
    activationEventType: PredefinedActionEventTypes.OnUserJoin,
    constraints: [
        () => cfg.features.welcomer.enabled ? Ok : Skip,
    ],
    callbacks: [
        async (member) => {
            if (await watchNewMember(member) == 'kicked') return MagicSkipAllActions;

            for (const role of cfg.features.welcomer.freeRolesForEveryone) {
                try {
                    await member.roles.add(role);
                } catch {
                    output.warn('welcomer: can\'t apply role <@&' + role + '> to <@' + member.id + '>')
                }
            }

            const welcomeChannel = await client.channels.fetch(cfg.features.welcomer.channelId);
            if (welcomeChannel == null || !welcomeChannel.isSendable()) return;

            const generalChannel = await client.channels.fetch(cfg.features.welcomer.general);
            if (generalChannel == null || !generalChannel.isSendable()) return;

            if (member.user.id == StartItId) {
                await welcomeChannel.send('Spierdalaj ty zjebie podludzki start it nikt cię tu nie chce');
                return;
            } else {
                await welcomeChannel.send('<:emoji1:1410551894023082027>' + (cfg.features.welcomer.welcomeMsgs[Math.floor(Math.random() * cfg.features.welcomer.welcomeMsgs.length)]).replace('<mention>', cfg.features.welcomer.mentionNewPeopleInLobby ? `<@${member.user.id}>` : member.user.username));
                await generalChannel.send(`witaj <@${member.user.id}>, będzie nam miło jak się przywitasz czy coś <:emoji_a_radosci_nie_bylo_konca:1376664467416420362>`);
            }
        }
    ],
}

export const sayGoodbyeAction: Action<UserEventCtx> = { 
    activationEventType: PredefinedActionEventTypes.OnUserQuit,
    constraints: [
        () => cfg.features.welcomer.enabled ? Ok : Skip,
    ],
    callbacks: [
        async (member) => {
            const channel = await client.channels.fetch(cfg.features.welcomer.channelId);
            if (!channel?.isSendable()) return;

            if (member.user.id == StartItId) {
                await channel.send('I dobrze, i tak nikt cię nie lubił start it!');
                return;
            }

            await channel.send('<:emoji2:1410551857935290368>' + (cfg.features.welcomer.goodbyeMsgs[Math.floor(Math.random() * cfg.features.welcomer.goodbyeMsgs.length)]).replace('<mention>', cfg.features.welcomer.mentionNewPeopleInLobby ? `<@${member.user.id}>` : member.user.username));
        }
    ],
};
