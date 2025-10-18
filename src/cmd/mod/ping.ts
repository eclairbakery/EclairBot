import { Command, CommandAPI, CommandFlags } from '@/bot/command.js';
import { cfg } from '@/bot/cfg.js';
import * as dsc from 'discord.js';

let interval1: NodeJS.Timeout;
let eclairPing = true;

let interval2: NodeJS.Timeout;

let deathChatQuestions: string[] = [
    'Masa pewnej gwiazdy to milion ton. Ile dzieci mają Ania i Bartek?',
    'Czy liczba naturalna jest dodatnia? Jeżeli tak, to co z zerem?',
    'Czy tylko mi, jak podzielę pisemnie zero przez zero, wychodzi nieskończonność na minusie?',
    'Ile to 0 do 0-wej potęgi? Teoretycznie cokolwiek podniesione do 0-wej potęgi to jeden. Ale teoretycznie 0 do jakiejkolwiek potęgi to dalej 0.',
    'Jaki film niedawno oglądałeś/-aś?',
    'Co sądzisz o funkcji if() w CSS?',
    'Czemu używasz akurat tego systemu operacyjnego, co używasz? Czemu nie NixOS albo Gentoo?',
    'Masz bottleneck (jakaś część komputera ogranicza inną)?',
    'Wolisz pisać w zwykłym html, css i js czy używać front-endowych frameworków jak react, next.js lub vue?',
    'Piszesz zazwyczaj aplikacje terminalowe, gry, strony internetowe czy coś innego?',
    'Lubisz rozmowy o polityce na generalu czy wolisz osobny kanał polityka?',
    'Czy banie się śmierci nie jest baniem się przed utratą świadomości? W takim razie czemu takie osoby często nie boją się zasnąć?',
    'Lubisz [Desaferio](<https://talk.shapes.inc/desaferio/dm>)?'
];

export const notifyCmd: Command = {
    name: 'notify',
    aliases: ['mention-ping'],
    description: {
        main: 'Siema... Chcesz pingować? No ok, to komenda dla ciebie.',
        short: 'Pinguje jakiś ping.'
    },
    flags: CommandFlags.Important,

    expectedArgs: [
        {
            name: 'type',
            type: 'string',
            optional: false,
            description: 'No podaj ten typ tego pingu, błagam!'
        }
    ],
    permissions: {
        allowedRoles: cfg.mod.commands.ping.allowedRoles,
        allowedUsers: [],
        discordPerms: []
    },

    async execute(api) {
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

import { Action, MessageEventCtx, PredefinedActionEventTypes } from '@/features/actions.js';

export const actionPing: Action<MessageEventCtx> = {
    activationEventType: PredefinedActionEventTypes.OnMessageCreate,
    constraints: [(msg) => msg.channelId === '1264971505662689311'],
    callbacks: [
        (msg) => {
            clearTimeout(interval2);
            interval2 = setTimeout(() => {
                const now = new Date();
                const options = {
                    timeZone: 'Europe/Warsaw',
                    hour: 'numeric',
                    hour12: false
                } satisfies Intl.DateTimeFormatOptions; // don't ask me what it does chatgpt wrote that satisfies
                const hour = parseInt(new Intl.DateTimeFormat('pl-PL', options).format(now), 10);

                if (hour >= 10 && hour < 20) {
                    if (msg.channel.isSendable()) {
                        msg.channel.send(`<@&1411646441511714827> ${deathChatQuestions[Math.floor(Math.random() * deathChatQuestions.length)]}`);
                    }
                }
            }, cfg.mod.commands.ping.deathChatRenewInterval);
        }
    ]
};
