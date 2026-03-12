import { Config } from "@/bot/cfg.js";
import { economyCfg } from "./economy.js";

const channelsCfg: Config['channels'] = {
    settings: {
        characters: {
            beforeEmoji: '﹝',
            afterEmoji: '﹞'
        },
        emojiPlacement: 'before-name',
        spaceReplacement: null
    },

    mod: {
        modGeneral: '1235552454838456433',
        logs: '1235641912241819669',
        warnings: '1305591940821028884',
        hallOfShame: '1290327060970995812',
        modCommands: '1392787737962090596',
        info: '1390389554623549641',
        assets: '1404396223934369844',
        eclairBotAlerts: '1431322991022833785'
    },
    important: {
        lobby: '1235560269871190056',
        rules: '1286058702214008935',
        announcements: '1235560320596967516',
        boosts: '1298706083556229222',
    },
    general: {
        general: '1264971505662689311',
        offtopic: '1392567715407073402',
        commands: '1235604839078035537',
        media: '1235567551753486407',
    },
    other: {
        communityPolls: '1320035545543606282',
        desktopPorn: '1279888407421648967',
        minecraft: '1342793182265741394',
        economy: '1235561759448895590',
    },
    forfun: {
        counting: '1235566520310956184',
        lastLetter: '1235566646324887562',
        finishSentence: '1276861659587280896',
        wordAssociation: '1235567493855187025',
        unfiltred: '1397628186795311246',
    },
    isolation: {
        isolationCell: '1415020477180674048',
    },
    eclairbot: {
        stdout: '1419323394440167555',
        stderr: '1419323609419092019',
        stdwarn: '1435307953660887101',
        email: '1479194690233438341',
        dbBackups: '1429118062816137318',
    },
    dev: {
        programming: '1426217543617740950'
    }
};

export const hierarchyCfg: Config['hierarchy'] = {
    developers: {
        allowedRoles: [
            "1280081773019140096"
        ],
        allowedUsers: [
            "1368171061585117224",
            "990959984005222410",
            "985053803151753316",
            "1274610053843783768",
            "1401568817766862899"
        ]
    },

    administration: {
        eclair25: '1280081773019140096',
        headAdmin: '1415710955022843904',
        admin: '1415710969732005980',
        headMod: '1415710973288910919',
        mod: '1415710976644349972',
        helper: '1415710980612034771'
    },

    automodBypassRoles: ['1380875827998097418'],
};

const commandsCfg: Config['commands']['configuration'] = {
    ban: {
        enabled: true,
        aliases: [],
        allowedRoles: [hierarchyCfg.administration.eclair25, hierarchyCfg.administration.headAdmin, hierarchyCfg.administration.admin, hierarchyCfg.administration.headMod],
        allowedUsers: [],
        reasonRequired: false
    },
    kick: {
        enabled: true,
        aliases: [],
        allowedRoles: [hierarchyCfg.administration.eclair25, hierarchyCfg.administration.headAdmin, hierarchyCfg.administration.admin, hierarchyCfg.administration.headMod],
        allowedUsers: [],
        reasonRequired: false,
    },
    mute: {
        enabled: true,
        aliases: [],
        allowedRoles: [hierarchyCfg.administration.eclair25, hierarchyCfg.administration.headAdmin, hierarchyCfg.administration.admin, hierarchyCfg.administration.headMod, hierarchyCfg.administration.mod, hierarchyCfg.administration.helper],
        allowedUsers: [],
        reasonRequired: false,
    },
    warn: {
        enabled: true,
        aliases: [],
        allowedRoles: [hierarchyCfg.administration.eclair25, hierarchyCfg.administration.headAdmin, hierarchyCfg.administration.admin, hierarchyCfg.administration.headMod, hierarchyCfg.administration.mod, hierarchyCfg.administration.helper],
        allowedUsers: [],
        reasonRequired: false,
        maxPoints: 30,
        minPoints: 1,
    },
    izolatka: {
        aliases: [],
        enabledForNormalAdministrators: true,
        allowedRoles: [hierarchyCfg.administration.eclair25, hierarchyCfg.administration.headAdmin, hierarchyCfg.administration.admin, hierarchyCfg.administration.headMod, hierarchyCfg.administration.mod, hierarchyCfg.administration.helper],
        allowedUsers: [],
        enabled: true
    },
    reset: {
        enabled: true,
        aliases: [],
        allowedRoles: [hierarchyCfg.administration.eclair25, hierarchyCfg.administration.headAdmin],
        allowedUsers: [],
    },
    crime: {
        enabled: true,
        aliases: [],
        allowedRoles: null,
        allowedUsers: null,

        cooldown: 15 * 60 * 1000,
        maximumCrimeAmount: 8000,
        minimumCrimeAmount: 2500,
        successRatio: 0.4
    }
};

export const defaultCfg: Config = {
    hierarchy: hierarchyCfg,

    channels: channelsCfg,

    commands: {
        prefix: 'sudo ',
        alternativePrefixes: [
            '.'
        ],
        confirmUnsafeCommands: false,
        confirmDeprecatedCommands: false,

        blocking: {
            full: {
                default: 'allow',
                deny: [],
            },
            fullExceptImportant: {
                default: 'allow',
                deny: [...Object.values(channelsCfg.forfun), channelsCfg.general.media],
            },
            spammy: {
                default: 'block',
                allow: [channelsCfg.general.commands, channelsCfg.mod.modCommands, channelsCfg.mod.modGeneral, channelsCfg.forfun.unfiltred],
            },
            economy: {
                default: 'block',
                allow: [channelsCfg.other.economy, channelsCfg.mod.modCommands],
            },
            preferShortenedEmbeds: [channelsCfg.general.general]
        },

        configuration: {},
        defaultConfiguration: {
            enabled: true,
            aliases: [],

            allowedUsers: null,
            allowedRoles: null,
        }
    },

    database: {
        path: 'bot.db',

        backups: {
            enabled: true,
            msg: '🗄️ automatyczny backup masz tutaj',
            interval: 2 * 60 * 60 * 1000
        }
    },

    features: {
        compilation: {
            replaceCompilerMap: {
                "c": "gcc-13.2.0",
            }
        },
        automod: {
            antiFloodEnabled: false,
            antiSpamEnabled: false,
        },
        welcomer: {
            channelId: channelsCfg.important.lobby,
            enabled: true,
            general: channelsCfg.general.general,
            mentionNewPeopleInLobby: false,
            welcomeMsgs: [
                `witaj szanowny użytkowniku <mention>!`,
                `siema, ale przystojny jesteś <mention> ngl`,
                `kocham cię <mention>`,
                `c-cczęsto masz tak na imie <mention>?`,
                `nie chce mi się, <mention>`,
                `<mention>, lubimy cie (chyba)`
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
                '1235540273556361268'
            ],
        },
        forFun: {
            media: [
                {
                    channel: channelsCfg.general.media,
                    addReactions: ['👍', '👎', '😭', '🙏', '🤣', '<:joe_i_git:1376096877610799205>'],
                    deleteMessageIfNotMedia: true,
                    shallCreateThread: true
                },
                {
                    channel: channelsCfg.mod.hallOfShame,
                    addReactions: ['🙏'],
                    deleteMessageIfNotMedia: false,
                    shallCreateThread: false
                }
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
                100: '1390802440739356762'
            },
            levelChannel: '1235592947831930993',
            shallPingWhenNewLevel: false,
            currentEvent: {
                enabled: false,
                channels: [channelsCfg.dev.programming],
                multiplier: 2
            }
        },
        hallOfFame: {
            channel: '1392128976574484592',
            eligibleChannels: [channelsCfg.general.general, channelsCfg.general.offtopic, channelsCfg.general.media, channelsCfg.mod.hallOfShame],
            enabled: false,
        },
        logs: {
            channel: channelsCfg.mod.logs,
            stdout: channelsCfg.eclairbot.stdout,
            stderr: channelsCfg.eclairbot.stderr,
            stdwarn: channelsCfg.eclairbot.stdwarn
        },
        economy: economyCfg,
        moderation: {
            protectedRoles: [],
            warnAutoActions: []
        },
        email: {
            listenerChannel: channelsCfg.eclairbot.email,
        },
        translations: [],
        watchdog: {
            trustNewMembers: false,
            fuckNewMembers: false,
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
                maxChannelDeletions: 2
            },
            approveDangerousPermissions: false
        }
    },

    emojis: {
        darkRedBlock:      { name: 'dark_red_block',    id: '1416021203331715082' },
        lightRedBlock:     { name: 'light_red_block',   id: '1416021243379056700' },
        darkGreenBlock:    { name: 'dark_green_block',  id: '1416021182964043856' },
        lightGreenBlock:   { name: 'light_green_block', id: '1416021218485600357' },

        circleProgressBar: {
            '0/4': { name: 'circle_progress_bar_04', id: '1416021170750492775' },
            '1/4': { name: 'circle_progress_bar_14', id: '1416021158779945020' },
            '2/4': { name: 'circle_progress_bar_24', id: '1416021143315546162' },
            '3/4': { name: 'circle_progress_bar_34', id: '1416021126890655894' },
        },

        heartAttackEmoji: { name: 'joe_zatrzymanie_akcji_serca', id: '1308174897758994443' },
        sadEmoji: { name: 'joe_smutny', id: '1317904814025474088' },
        wowEmoji: { name: 'joe_wow', id: '1308174905489100820' },
        idkEmoji: { name: 'joe_noniewiemno', id: '1317904812779503676' }
    },
};