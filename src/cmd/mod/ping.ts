import { Command } from '../../bot/command.js';
import { db } from '../../bot/db.js';

import * as log from '../../util/log.js';
import * as dsc from 'discord.js';
import { PredefinedColors } from '../../util/color.js';
import { cfg } from '../../bot/cfg.js';

import actionsManager, { OnForceReloadTemplates, ForceReloadTemplatesEventCtx } from '../../events/templatesEvents.js';
import { Action, MessageEventCtx, PredefinedActionEventTypes } from '../../features/actions.js';

// eclairnews
let interval1: NodeJS.Timeout;
let eclairPing = true;

// death chat
let interval2: NodeJS.Timeout;

export const notifyCmd: Command = {
    name: 'notify',
    longDesc: 'Siema... Chcesz pingować? No ok, to komenda dla ciebie.',
    shortDesc: 'Pinguje jakiś ping.',
    expectedArgs: [],

    aliases: ['mention-ping'],
    allowedRoles: cfg.mod.commands.ping.allowedRoles,
    allowedUsers: [],

    async execute(msg, args) {
        if (args.includes('death-chat')) {
            return msg.reply('ten ping jest zaautomatyzowany');
        }
        if (args.includes('list')) {
            return msg.reply('lista: `death-chat`, `eclairnews`');
        }
        if (args.includes('eclairnews')) {
            if (!eclairPing) {
                return msg.reply('za szybko ig');
            }
            clearTimeout(interval1);
            eclairPing = false;
            interval1 = setTimeout(() => {
                eclairPing = true;
            }, cfg.mod.commands.ping.eclairNewsRenewInterval);
            if (msg.channel.isSendable()) msg.channel.send('<@&1402756114394644620>');
        }
    }
};

export const actionPing: Action<MessageEventCtx> = {
    activationEventType: PredefinedActionEventTypes.OnMessageCreate,
    constraints: [(msg) => msg.channelId == '1264971505662689311'],
    callbacks: [(msg) => {
        clearTimeout(interval2);
        interval2 = setTimeout(() => {
            const now = new Date();
            const hour = now.getHours();

            if (hour >= 10 && hour < 20) {
                if (msg.channel.isSendable()) {
                    msg.channel.send('<@&1411646441511714827>');
                }
            }
        }, cfg.mod.commands.ping.deathChatRenewInterval);
    }]
};