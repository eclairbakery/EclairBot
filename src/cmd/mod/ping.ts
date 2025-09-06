import { Command, CommandAPI } from '../../bot/command.js';
import { cfg } from '../../bot/cfg.js';
import * as dsc from 'discord.js';

let interval1: NodeJS.Timeout;
let eclairPing = true;

let interval2: NodeJS.Timeout;

export const notifyCmd: Command = {
    name: 'notify',
    description: {
        main: 'Siema... Chcesz pingować? No ok, to komenda dla ciebie.',
        short: 'Pinguje jakiś ping.'
    },
    permissions: {
        allowedRoles: cfg.mod.commands.ping.allowedRoles,
        allowedUsers: [],
        discordPerms: []
    },
    expectedArgs: [
        {
            name: 'type',
            type: 'string',
            optional: false,
            description: 'No podaj ten typ tego pingu, błagam!'
        }
    ],
    aliases: ['mention-ping'],
    execute: async (api: CommandAPI) => {
        const msg = api.msg;
        const typeArg = api.getArg('type')?.value as string;

        if (!typeArg) return msg.reply('Musisz podać typ pingu!');

        if (typeArg === 'death-chat') {
            return msg.reply('ten ping jest zaautomatyzowany');
        }

        if (typeArg === 'list') {
            return msg.reply('lista: `death-chat`, `eclairnews`');
        }

        if (typeArg === 'eclairnews') {
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

import { Action, MessageEventCtx, PredefinedActionEventTypes } from '../../features/actions.js';

export const actionPing: Action<MessageEventCtx> = {
    activationEventType: PredefinedActionEventTypes.OnMessageCreate,
    constraints: [(msg) => msg.channelId === '1264971505662689311'],
    callbacks: [
        (msg) => {
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
        }
    ]
};