import { Command, CommandAPI, CommandFlags } from '@/bot/command.js';
import { cfg } from '@/bot/cfg.js';
import * as dsc from 'discord.js';
import { Action, MessageEventCtx, PredefinedActionEventTypes } from '@/features/actions/index.js';

let eclairPing = true;
let deathChatTimeout: NodeJS.Timeout;
let eclairTimeout: NodeJS.Timeout;

export interface PingAPI {
    roleId: `${number}`;
    questions: string[] | null;
    automatic: boolean;
    automaticWaitUntilLastMsgInterval: number;
}

export const pings: Record<string, PingAPI> = {
    'death-chat': {
        roleId: '1411646441511714827',
        questions: [
            'Masa pewnej gwiazdy to milion ton. Ile dzieci mają Ania i Bartek?',
            'Czy liczba naturalna jest dodatnia? Jeżeli tak, to co z zerem?',
            'Czy tylko mi, jak podzielę pisemnie zero przez zero, wychodzi nieskończoność na minusie?',
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
        ],
        automatic: true,
        automaticWaitUntilLastMsgInterval: cfg.commands.mod.ping.deathChatRenewInterval
    },
    'eclairnews': {
        roleId: '1402756114394644620',
        questions: null,
        automatic: false,
        automaticWaitUntilLastMsgInterval: cfg.commands.mod.ping.eclairNewsRenewInterval
    }
};

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
            description: 'Podaj typ pingu: death-chat, eclairnews'
        }
    ],
    permissions: {
        allowedRoles: cfg.commands.mod.ping.allowedRoles,
        allowedUsers: [],
        discordPerms: []
    },

    async execute(api: CommandAPI) {
        const msg = api.msg;
        const typeArg = api.getArg('type')?.value as string;

        if (!typeArg) return msg.reply('Musisz podać typ pingu!');

        const pingConfig = pings[typeArg];
        if (!pingConfig) return msg.reply('Nieznany typ pingu!');

        if (pingConfig.automatic) {
            return msg.reply('Ten ping jest zaautomatyzowany i nie można go wywołać ręcznie.');
        }

        if (!pingConfig.automatic) {
            if (typeArg === 'eclairnews') {
                if (!eclairPing) return msg.reply('Za szybko! Odczekaj chwilę przed kolejnym pingiem.');

                clearTimeout(eclairTimeout);
                eclairPing = false;
                eclairTimeout = setTimeout(() => { eclairPing = true; }, pingConfig.automaticWaitUntilLastMsgInterval);

                if (msg.channel.isSendable()) {
                    msg.channel.send(`<@&${pingConfig.roleId}>`);
                }
            }
        }
    }
};

export const actionPing: Action<MessageEventCtx> = {
    activationEventType: PredefinedActionEventTypes.OnMessageCreate,
    constraints: [(msg) => msg.channelId === '1264971505662689311'],
    callbacks: [
        (msg) => {
            clearTimeout(deathChatTimeout);
            deathChatTimeout = setTimeout(() => {
                const now = new Date();
                const options: Intl.DateTimeFormatOptions = {
                    timeZone: 'Europe/Warsaw',
                    hour: 'numeric',
                    hour12: false
                };
                const hour = parseInt(new Intl.DateTimeFormat('pl-PL', options).format(now), 10);

                if (hour >= 10 && hour < 20) {
                    const pingConfig = pings['death-chat'];
                    if (pingConfig?.questions && msg.channel.isSendable()) {
                        const question = pingConfig.questions[Math.floor(Math.random() * pingConfig.questions.length)];
                        msg.channel.send(`<@&${pingConfig.roleId}> ${question}`);
                    }
                }
            }, pings['death-chat'].automaticWaitUntilLastMsgInterval);
        }
    ]
};
