import { Config } from '@/bot/cfg.ts';
import { channelsCfg } from './channels.ts';
import { economyCfg } from './economy.ts';
import { hierarchyCfg } from './hierarchy.ts';

export const featuresConfig: Config['features'] = {
    compilation: {
        replaceCompilerMap: {
            'gcc-head-c':        ['c', 'gcc'],
            'gcc-head':          ['cpp', 'c++', 'g++'],
            'dmd-2.109.1':       ['d', 'dmd'],
            'bash':              ['bash', 'sh'],
            'openjdk-jdk-22+36': ['java', 'bloat'],
            'zig-head':          ['zig'],
            'go-1.23.2':         ['golang', 'go'],
            'ghc-9.10.1':        ['haskell', 'ghc'],
            'php-8.3.12':        ['php', 'vulnerability'],
            'sqlite 3.46.1':     ['sql', 'sqlite'],
            'cpython-head':      ['python', 'py'],
            'nodejs-20.17.0':    ['js', 'javascript'],
            'typescript-5.6.2':  ['ts', 'typescript', 'bloatscript'],
            'vim-9.1.0758':      ['vim', 'vimscript'],
        },
    },
    automod: {
        antiFloodEnabled: false,
        antiSpamEnabled: false,
    },
    welcomer: {
        enabled: true,
        mentionNewPeopleInLobby: false,
        welcomeMsgs: [
            `witaj szanowny użytkowniku <mention>!`,
            `siema, ale przystojny jesteś <mention> ngl`,
            `kocham cię <mention>`,
            `c-cczęsto masz tak na imie <mention>?`,
            `nie chce mi się, <mention>`,
            `<mention>, lubimy cie (chyba)`,
        ],
        goodbyeMsgs: [
            `do widzenia <mention>!`,
            `żegnaj <mention>, będziemy za tobą tęsknić! (chyba)`,
            `<mention> opuścił nasz serwer, ale zawsze może wrócić! (nie wróci)`,
        ],
        freeRolesForEveryone: [
            '1235548306550161451',
            // roles for appereance
            '1235540123576176652',
            '1415582195564806154',
            '1235541500889137273',
            '1235540273556361268',
        ],
    },
    forFun: {
        media: [
            {
                channel: channelsCfg.general.media,
                addReactions: ['👍', '👎', '😭', '🙏', '🤣', '<:joe_i_git:1376096877610799205>'],
                deleteMessageIfNotMedia: true,
                shallCreateThread: true,
            },
            {
                channel: channelsCfg.mod.hallOfShame,
                addReactions: ['🙏'],
                deleteMessageIfNotMedia: false,
                shallCreateThread: false,
            },
        ],
        countingChannel: channelsCfg.forfun.counting,
        lastLetterChannel: channelsCfg.forfun.lastLetter,
    },
    leveling: {
        xpPerMessage: 4,
        levelDivider: 100,
        excludedChannels: [],
        canChangeXP: ['1404392144441180221', hierarchyCfg.administration.eclair25],
        milestoneRoles: {
            3: '1297559525989158912',
            5: '1235550102563852348',
            10: '1235550105751392276',
            15: '1235550109891035218',
            20: '1235570092218122251',
            25: '1235594078305914880',
            30: '1235594081556627577',
            50: '1235594083544858667',
            75: '1235594085188767835',
            100: '1390802440739356762',
        },
        levelChannel: '1235592947831930993',
        shallPingWhenNewLevel: false,
        currentEvent: {
            enabled: false,
            channels: [channelsCfg.dev.programming],
            multiplier: 2,
        },
        voice: {
            xpPerMinute: 16,
            estimatedRealMembers: {
                requiredLevel: 5,
                requiredPeople: 3
            }
        }
    },
    hallOfFame: {
        channel: '1392128976574484592',
        eligibleChannels: [channelsCfg.general.general, channelsCfg.general.offtopic, channelsCfg.general.media, channelsCfg.mod.hallOfShame],
        enabled: false,
    },
    economy: economyCfg,
    email: {
        listenerChannel: channelsCfg.eclairbot.email,
    },
    translations: [],
    watchdog: {
        trustNewMembers: false,
        kickNewMembers: false,
        minimumAccountAge: 3,
        massJoinWindow: 10 * 60 * 1000,
        massJoinThreshold: 5,
        similarityThreshold: 3,
        allowNewBots: false,
        shallAutoDegrade: true,
        notForgiveAdministration: false,
        limitsConfiguration: {
            maxMutes: 6,
            maxWarns: 4,
            maxChannelCreations: 10,
            maxChannelDeletions: 2,
        },
        approveDangerousPermissions: false,
    },
    ai: {
        allowPolitics: false,
        allowPhilosophy: true,
        contextDefaultMessages: 15,
        contextMaxMessages: 30,
    },
};
