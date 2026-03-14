import { cfg } from '@/bot/cfg.js';
import { Action, MessageEventCtx, PredefinedActionEventTypes } from '@/features/actions/index.js';
import capitalizeFirst from '@/util/capitalizeFirst.js';

let deathChatTimeout: number;

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
            // life
            'jakie filmy ostatnio oglądałeś',
            'jakiej muzyki słuchasz',
            'kawa czy herbata',
            'koty czy psy',
            'dzień czy noc',
            'pizza czy burger',
            'film czy serial',
            'konsola czy PC',

            // maths
            'czy matematyka została odkryta czy wymyślona',
            'czy gdyby PI było liczbą wymierną, świat wyglądałby inaczej',

            // software
            'taby czy spacje',
            'Linux czy Windows',
            'jakie distro linuxa wariacie',
            'jaki był twój pierwszy język programowania',
            'jaki język programowania najbardziej cię irytuje',
            'co jest gorsze: PHP czy Java',
            'ile masz otwartych tabów w przeglądarce',
            'czy StackOverflow jeszcze żyje',
            'umiesz czytać regexy',
            'w jakie gry grasz',
            'jakie projekty ostatnio robisz',

            // hardware
            'karty graficzne: Nvidia, AMD czy Intel',
            'jaki producent CPU jest twoim ulubionym',
            'ile masz RAMu Czy według ciebie to dużo czy mało',
            'wolisz czarne czy białe podzespoły',
            'lubisz RGB czy wolisz wyłączone',
            'jaki rozmiar klawiatury jest najlepszy',
            'ile portów USB masz i ile z nich używasz',
            'ile masz monitorów a ile chciałbyś mieć',
        ],
        automatic: true,
        automaticWaitUntilLastMsgInterval: 2 * 60 * 60 * 1000
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
                        msg.channel.send(`<@&${pingConfig.roleId}> ${capitalizeFirst(question)}${question.endsWith('?') ? '' : '?'}`);
                    }
                }
            }, pings['death-chat'].automaticWaitUntilLastMsgInterval);
        }
    ]
};
