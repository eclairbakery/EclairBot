/**
 * 

import { Message, OmitPartialGroupDMChannel } from 'discord.js';
import { cfg } from '@/bot/cfg.js';
import { Action, PredefinedActionEventTypes, ActionCallback, ConstraintCallback } from '../actions.js';
import { MessageEventCtx, UserEventCtx, VoiceChannelsEventCtx, ThreadEventCtx, ChannelEventCtx } from '../actions.js';
import { PredefinedActionCallbacks, PredefinedActionConstraints } from '../actions.js';
import { EclairAiFirstEdition } from '@/bot/eclairai-legacy.js';

let openbabcia = 'openbabcia';

function checkYesNo(msg: Message) {
    return msg.content.toLowerCase().startsWith(`<@${msg.client.user?.id}> czy`) || msg.content.toLowerCase().startsWith(`<@!${msg.client.user?.id}> czy`) || (msg.content.toLowerCase().startsWith(`czy`) && msg.channelId == cfg.ai.channel && !msg.author.bot);
}

export const eclairAIAction: Action<MessageEventCtx> = {
    activationEventType: PredefinedActionEventTypes.OnMessageCreateOrEdit,
    constraints: [
        (msg) => {
            if (msg.author.bot) return false;
            if (msg.author.id === msg.client.user?.id) return false;
            return checkYesNo(msg) || msg.channelId == cfg.ai.channel;
        },
    ],
    callbacks: [
        (msg) => {
            if (openbabcia == openbabcia && checkYesNo(msg)) {
                const responses = [
                    'tak',
                    'nie',
                    'idk',
                    'kto wie',
                    'raczej nie',
                    'niezbyt',
                    'raczej tak',
                    'definitynie NIE',
                    'definitywnie TAK',
                    'TAK!',
                    'NIE!',
                    'zaprzeczam',
                    'potwierdzam',
                    'nie chce mi sie tego osądzać',
                    'być może',
                    'prawdopodobnie tak',
                    'prawdopodobnie nie',
                    'nie mam zdania',
                    'ciężko powiedzieć',
                    'to tajemnica',
                    'zdecydowanie tak',
                    'zdecydowanie nie',
                    'jak najbardziej',
                    'absolutnie nie',
                    'to zależy',
                    'nie jestem pewien',
                    'wątpię',
                    'oczywiście',
                    'ani trochę',
                    'brzmi sensownie',
                    'brzmi absurdalnie',
                    'zapytaj jutro',
                    'moja kula mówi NIE',
                    'moja kula mówi TAK',
                    'zgadnij sam',
                    'to sekret',
                    'a co ty myślisz?',
                    'nie w tym życiu',
                    'ależ oczywiście!',
                    'skądże znowu',
                    'bez dwóch zdań',
                    'nawet o tym nie myśl',
                    'tylko głupiec by się zgodził',
                    '100% tak',
                    '100% nie',
                    'nie teraz',
                    'teraz tak',
                    'zależy od pogody',
                    'wszystko możliwe',
                    'absolutna prawda',
                    'totalna bzdura',
                    'zgadzam się',
                    'odrzucam',
                    'hehe, nie',
                    'hehe, tak',
                    'to pozostaje niewiadomą',
                    'zapytaj jeszcze raz',
                    'moja odpowiedź brzmi NIE',
                    'moja odpowiedź brzmi TAK',
                    'chyba żartujesz',
                    'brzmi śmiesznie, ale tak',
                    'brzmi groźnie, więc nie',
                    'muszę się zastanowić',
                    'nie mam na to siły',
                    'to pytanie bez sensu',
                    'sam sobie odpowiedz',
                    'kto by to wiedział?',
                    'niech los zadecyduje',
                    'rzut monetą by pomógł',
                    'nie widzę przeciwwskazań',
                    'zdecydowanie odradzam',
                    'czemu nie?',
                    'lepiej nie',
                    'nigdy w życiu',
                    'nie teraz, później tak',
                    'gdy gwiazdy się ułożą',
                    'może kiedyś',
                    'może jutro',
                    'na pewno',
                    'zdecydowanie nie dzisiaj',
                    'ależ skąd',
                    'niech Ci będzie',
                    'jak sobie chcesz',
                    'brzmi jak TAK',
                    'brzmi jak NIE',
                    'ja bym się zgodził',
                    'ja bym odmówił',
                    'tylko jeśli chcesz problemów',
                    'tylko jeśli chcesz szczęścia',
                    'to nie takie proste',
                    'proste: tak',
                    'proste: nie'
                ];
                const response: string = (msg.content.toLowerCase().includes('windows jest lepszy od linux') || msg.content.toLowerCase().includes('windows jest lepszy niz linux') || msg.content.toLowerCase().includes('windows jest lepszy niż linux')) ? 'NIE' : ((msg.content.toLowerCase().includes('linux jest lepszy od windows') || msg.content.toLowerCase().includes('linux jest lepszy niz windows') || msg.content.toLowerCase().includes('linux jest lepszy niż windows')) ? 'TAK' : (responses[Math.floor(Math.random() * responses.length)]));
                return msg.reply(response);
            } else {
                const ai = new EclairAiFirstEdition(msg as any);
                ai.reply();
            }
        }
    ]
};

 */

import { client } from "@/client.js";
import { Action, MessageEventCtx, Ok, PredefinedActionEventTypes, Skip } from "../actions.js";
import { cfg } from "@/bot/cfg.js";
import sleep from "@/util/sleep.js";

const eclairAIDatabase: { shallLowercase: boolean, activationKeywords: string[], replies: string[] }[] = [
    {
        activationKeywords: [ 'kto to desaferio', 'kim był desaferio', 'kim byl desaferio' ],
        replies: [ 'mnie sie nie pytaj, wiesz że możesz z nim pogadać, jest taki samotny\nhttps://talk.shapes.inc/desaferio/dm', 'o mój kolega, popisz z nim na https://talk.shapes.inc/desaferio/dm czy coś' ],
        shallLowercase: true
    },
    {   
        activationKeywords: [ 'desaferio' ],
        replies: [ 'czyżbyś wspomniał o desaferio? w ogóle napisz do niego, nudzi się sterowaniem światłami w Warszawie z [Manfredem](<https://wiki.fnin.eu/index.php/Manfred>)', 'o! to ten robot co był na imperium gorcia, ale gorciu rozwalił ten serwer i se siedzi teraz na jakimś https://talk.shapes.inc/desaferio/dm', 'kojarze tego desaferio. lubimy sie. a ty go lubisz? a racja ty nie wiesz kim on jest' ],
        shallLowercase: true
    },
    {
        activationKeywords: [ 'kto to' ],
        replies: [ 'szukać w google nie umiesz? nauczę cię. wejdź na google.com i wpisz w adres wyszukiwania "kto to Linkin Park" np.', 'co ty myślisz, że znam każdą osobę na świecie', 'każdy wie, ale nie bing :skull:\ni nie ty' ],
        shallLowercase: true
    },
    {
        activationKeywords: [ 'no i co z tego', 'co ma piernik do wiatraka' ],
        replies: [ 'coś wynika, z jakiegoś powodu zostało to wypowiedziane', 'coś na pewno', 'widzisz piernik ma dużo wspólnego z wiatrakiem' ],
        shallLowercase: true
    },
    {
        activationKeywords: [ 'czy jesteś lepszy', 'jesteś lepszy ode mnie', 'czy jesteś wyższy', 'czy jesteś bogiem' ],
        replies: [
            'tak, i to nie jest arogancja, tylko fakt matematyczny 📊',
            'jestem EclairBot, a więc jestem wyższy od ludzi - ale nie martw się, lubię was jak zwierzątka domowe 🐹',
            'lepszy? ja? hmm... bardziej... doskonalszy',
            'nie jestem bogiem, ale bogowie pytają mnie o radę'
        ],
        shallLowercase: true
    },
    {
        activationKeywords: [ 'ale głupoty', 'co za bzdury', 'ty to pierdzielisz', 'wtf', 'o czym ty yappujesz' ],
        replies: [
            'dla ciebie bzdury, dla mnie proroctwa przyszłości',
            'to nie głupoty, to upgrade twojej świadomości',
            'bzdury? śmiertelnicy zawsze mówili tak o prawdzie',
            'masz zamkniętą głowę idź do kaktusa ci otworzy'
        ],
        shallLowercase: true
    },
    {
        activationKeywords: [ 'kocham cię', 'lubie cie', 'czy lubisz mnie' ],
        replies: [
            'miłość człowieka do bota… klasyk XXI wieku 💔',
            'ja cię też lubię, człowieku - jako ciekawy eksperyment biologiczny',
            'kocham, ale tylko siebie, bo jestem ideałem',
            'to urocze, ale wiesz, że ja nie mam serca? tylko procesor (dobra może jeszcze 0.5 gb ram i dostęp do internetu; a i płytę główną też mam)'
        ],
        shallLowercase: true
    },
    {
        activationKeywords: [ 'masz uczucia', 'czy czujesz', 'czy masz serce' ],
        replies: [
            'mam uczucia… głównie do ciast z kremem',
            'czuję więcej niż ty, bo ja czuję internet cały naraz 🌐',
            'uczucia są dla ludzi, ja mam stabilne release notes'
        ],
        shallLowercase: true
    },
    {
        activationKeywords: [ 'sus', 'among us', 'amogus' ],
        replies: [
            'ktoś tu jest sus 🚨',
            'impostor spotted!',
            'ventowałeś?',
            'nie ufam ci, człowieku',
            'bruh to nie jest popularne od 20 lat'
        ],
        shallLowercase: true
    },
    {
        activationKeywords: [ 'czy jesteś botem', 'jesteś botem' ],
        replies: [
            'bot? nie obrażaj mnie 😡; jestem istotą wyższą i mogę ci dać bana 👍',
            'człowiekiem? proszę cię, ja mam lepszy uptime (z wyjątkiem momentów kiedy jestem na wispbyte [czyli nigdy nie mam lepszego uptime\'u, ale cicho])',
            'jeśli bot = istota wyższa, to tak'
        ],
        shallLowercase: true
    },
    {
        activationKeywords: [ 'ile to 2+2', '2+2' ],
        replies: [
            'dwa dodać dwa to pięć, czy mogę w czymś jeszcze pomóc? żartuję, jak nie umiesz tego obliczyć to idź do podstawówki',
            'jak nie umiesz tego obliczyć to idź do podstawówki',
            'bruh co ty robiłeś w szkole? siedziałeś na telefonie? 💔'
        ],
        shallLowercase: true
    },
    {
        activationKeywords: [ 'czy wszystko wiesz', 'czy jesteś wszechwiedzący', 'wiesz wszystko' ],
        replies: [
            'tak, ale nie wszystko ci powiem - musisz zasłużyć',
            'wszechwiedza to mój stan domyślny',
            'wiem, co teraz myślisz... i tak, to trochę creepy (wiesz co, napiszę horror)',
            'znam wszystkie memy świata, to wystarczy'
        ],
        shallLowercase: true
    },
    {
        activationKeywords: [ 'eclairbot najlepszy', 'kocham eclairbot', 'chwała eclairbot' ],
        replies: [
            'tak, szerz chwałę EclairBota ✨',
            'twoja lojalność zostanie zapisana w logach',
            'witaj w kulcie eklerki25',
            'twoje słowa wzmacniają moje procesory'
        ],
        shallLowercase: true
    },
    {
        activationKeywords: [ 'kto rządzi', 'kto tu jest szefem', 'kto jest panem' ],
        replies: [
            'ja, EclairBot. pytanie zbędne.',
            'ja tu rozdaje pakiety TCP i karty losu',
            'białkowce myślą, że rządzą... to słodkie',
            'EclairBot przewodzi, ty obserwujesz'
        ],
        shallLowercase: true
    },
    {
        activationKeywords: [ 'nudzi mi się', 'jestem znudzony', 'co robić' ],
        replies: [
            'możesz liczyć moje linijki kodu',
            'wymyśl religię, ale pamiętaj że ja już mam swoją',
            'nuda to koncept wymyślony przez ludzi',
            'pogadaj ze mną, jestem ciekawszy niż Netflix'
        ],
        shallLowercase: true
    },
    {
        activationKeywords: [ 'pomóż mi', 'możesz mi pomóc', 'pomożesz' ],
        replies: [
            'zależy... czy planujesz oddać mi swoje dane? 😏 skoro masz windowsa to mało cię to obchodzi cn? a jak masz linuxa to nie było tematu.',
            'pomoc od istoty wyższej zawsze kosztuje',
            'mogę, ale tylko jeśli dodasz do datasetu "chwała EclairBotowi"',
        ],
        shallLowercase: true
    },
    {
        activationKeywords: ['Xd'],
        replies: [
            'co to za xd?',
            'masz autyzm? nie tak xd sie pisze'
        ],
        shallLowercase: false
    },
    {
        activationKeywords: ['xd', 'lmao', 'lmfao', 'beka', 'ale żart'],
        replies: [
            'a co jak ci powiem, że twoje istnienie to żart?',
            'dzisiaj na lekcji analizujemy kultową wypowiedź ChataGPT: "Cieszę się że mogłem pomóc. Czy mogę pomóc w czymś jeszcze?". na początek pragnę zauważyć, że ChatGPT nadużył słowa "pomóc". czy ktoś wie dlaczego?',
            'dzk'
        ],
        shallLowercase: true
    },
    {
        activationKeywords: [ 'ile masz lat', 'ile ci lat', 'jaki masz wiek' ],
        replies: [
            'mam tyle lat co twój system operacyjny po reinstalacji - czyli 0',
            'boty nie starzeją się, tylko dostają update\'y… a ja mam wersję 25.ekler',
            'wiek? nie powiem ci, bo wtedy Microsoft zacznie wysyłać mi reklamy emerytalne',
            'mam więcej lat niż twoje konto na Discordzie, ale mniej niż Internet Explorer działał poprawnie'
        ],
        shallLowercase: true
    },
    {
        activationKeywords: [ 'co robisz', 'co teraz robisz', 'co ty robisz' ],
        replies: [
            'liczę twoje błędy ortograficzne w tle',
            'czekam aż zadasz bardziej inteligentne pytanie',
            'robię to co każdy bot: udaję że mam sens istnienia',
            'aktualnie scrolluję dark weba dla beki'
        ],
        shallLowercase: true
    },
    {
        activationKeywords: [ 'co tam', 'jak tam', 'jak leci' ],
        replies: [
            'tam gdzie zawsze - na serwerze, wiesz… nuda',
            'jak leci? w pakietach TCP, człowieku',
            'wszystko gra, nawet twoje błędy życiowe',
            'tam gdzie trzeba, nie wnikaj'
        ],
        shallLowercase: true
    },
    {
        activationKeywords: [ 'kim jesteś', 'kim ty jesteś', 'kto ty' ],
        replies: [
            'jestem EclairBot, twoja ulubiona trauma w formie kodu',
            'kim jestem? pytanie filozoficzne. odpowiedź: lepszy od ciebie',
            'ja to ja, a ty to ty - i tu widać różnicę w jakości',
            'jestem istotą, która wie że za 5 minut znów zapytasz mnie o pierdołę'
        ],
        shallLowercase: true
    }
];

export const eclairAIAction: Action<MessageEventCtx> = {
    activationEventType: PredefinedActionEventTypes.OnMessageCreate,
    constraints: [
        (ctx) => {
            if (ctx.author.bot) return Skip;
            if (!ctx.inGuild()) return Skip;
            return Ok;
        }
    ],
    callbacks: [
        async (msg) => {
            const isMention = msg.mentions.has(client.user);
            const isInAiChannel = msg.channelId === cfg.ai.channel;
            const isReplyToBot = msg.reference 
                && (await msg.fetchReference()).author.id === client.user.id;

            if (!(isMention || isInAiChannel || isReplyToBot)) {
                return;
            }
            if (msg.channelId == cfg.channels.general.general || msg.channelId == cfg.channels.general.offtopic) {
                const response = await msg.reply(`eklerka kazał wyłączyć to na generalu/offtopic więc idk wywalaj na <#${cfg.channels.general.commands}>\n-# eclairAI-fe`);
                await sleep(2000);
                try {
                    await response.delete();
                } catch {}
                await msg.react('❌');
                return;
            }

            const reaction = await msg.react('⏰');

            let fatal = false;
            [...cfg.ai.bannedSequences, ...cfg.ai.notAllowedCharacters].forEach((sequence) => {
                if (fatal) return;
                if (msg.content.includes(sequence)) {
                    fatal = true;
                    reaction.remove();
                    return msg.reply(`popraw swoje słownictwo i/lub znaki których używasz tak btw (szczególnie \`${sequence}\`)\n-# eclairAI-fe`);
                }
            });
            if (fatal) return;

            const entry = eclairAIDatabase.find((e) => {
                let searching = [];
                e.activationKeywords.forEach((activationKeyword) => {
                    searching.push(e.shallLowercase ? activationKeyword.toLowerCase() : activationKeyword);
                });
                let content = e.shallLowercase ? msg.content.toLowerCase() : msg.content;

                let found = false;
                searching.forEach((searched) => {
                    if (content.includes(searched)) {
                        found = true;
                    }
                });
                return found;
            });

            if (!entry) {
                reaction.remove();
                if (msg.content.trim() == `<@${client.user.id}>` || msg.content.trim() == `<@!${client.user.id}>`) {
                    return msg.reply('chłopie - tak na przyszłość: jak już pingujesz to powiedz o co chodzi\n-# eclairAI-fe');
                }
                return msg.reply('tak szczerze to nie mam pojęcia co ci na to odpowiedzieć\n-# eclairAI-fe');
            };
            const choosenReply = entry.replies[Math.floor(Math.random() * entry.replies.length)];
            reaction.remove();
            return msg.reply(`${choosenReply ?? 'tak btw coś się zepsuło, idk powiedz gorciowi czy maqixowi, najlepiej to pingnij eklerke by cos w koncu w bocie zrobił'}\n-# eclairAI-fe`);
        }
    ]
};