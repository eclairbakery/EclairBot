import { Config } from '../../../cfg.ts';
import { economyCfg } from '../eclairbakery/economy.ts';

const allowRule: Config['commands']['blocking']['full'] = { default: 'allow', deny: [] };

const emojiRule = { id: '1', name: '1' };

export const testingCfg: Config = {
    database: {
        path: "bot.db",
        backups: {
            msg: "tu jest backup",
            interval: 60 * 60 * 1000,
            enabled: false
        }
    },

    commands: {
        prefix: "działaj bruh czy ty kiedykolwiek zadziałasz ",
        alternativePrefixes: [
            "sudo ", "."
        ],
        
        blocking: {
            full: allowRule,
            fullExceptImportant: allowRule,
            spammy: allowRule,
            economy: allowRule,

            preferShortenedEmbeds: []
        },

        confirmDeprecatedCommands: false,
        confirmUnsafeCommands: false,

        configuration: {},
        defaultConfiguration: {
            enabled: true,
            aliases: [],

            allowedRoles: null,
            allowedUsers: null
        }
    },

    emojis: {
        darkRedBlock: emojiRule, darkGreenBlock: emojiRule,
        lightGreenBlock: emojiRule, lightRedBlock: emojiRule,

        idkEmoji: emojiRule, wowEmoji: emojiRule, sadEmoji: emojiRule,
        heartAttackEmoji: emojiRule,

        circleProgressBar: {
            '1/4': emojiRule, '2/4': emojiRule, '3/4': emojiRule, '4/4': emojiRule
        }
    },
    
    features: {
        forFun: {
            media: [],
            lastLetterChannel: '1420409133336756286',
            countingChannel: '1420409031079628911'
        },
        economy: economyCfg,
        ai: {
            allowPhilosophy: true,
            allowPolitics: true,
            contextDefaultMessages: 10,
            contextMaxMessages: 30
        },
        email: {
            listenerChannel: '1486764529592307742'
        },
        compilation: {
            replaceCompilerMap: {}
        },
        welcomer: {
            enabled: true,
            goodbyeMsgs: ['nara <mention>'],
            welcomeMsgs: ['siema <mention>'],
            freeRolesForEveryone: [],
            mentionNewPeopleInLobby: true
        },
        leveling: {
            canChangeXP: [],
            currentEvent: {
                enabled: false,
                multiplier: 1,
                channels: []
            },
            levelDivider: 100,
            levelChannel: '1416782242159661106',
            xpPerMessage: 4,
            milestoneRoles: {},
            excludedChannels: [],
            shallPingWhenNewLevel: false,
            voice: {
                xpPerMinute: 16,
                estimatedRealMembers: {
                    requiredLevel: 5,
                    requiredPeople: 3
                }
            }
        },
        automod: {
            antiFloodEnabled: true,
            antiSpamEnabled: true
        },
        hallOfFame: {
            enabled: false,
            channel: '',
            eligibleChannels: []
        },
        translations: [],
        watchdog: {
            allowNewBots: false,
            kickNewMembers: false,
            trustNewMembers: false,
            notForgiveAdministration: true,
            approveDangerousPermissions: false,
            minimumAccountAge: 1,
            shallAutoDegrade: true,
            limitsConfiguration: {
                maxMutes: 10000,
                maxWarns: 10000,
                maxChannelCreations: 10,
                maxChannelDeletions: 3
            },
            massJoinThreshold: 1,
            massJoinWindow: 1,
            similarityThreshold: 1
        }
    },

    hierarchy: {
        developers: {
            allowedUsers: [],
            allowedRoles: ['1420410808130867301']
        },
        automodBypassRoles: ['1420410808130867301'],
        administration: {
            eclair25: '1420410808130867301', headAdmin: '1420410808130867301',
            admin: '1420410808130867301', headMod: '1420410808130867301',
            mod: '1420410808130867301', helper: '1420410808130867301', 
        }
    },
    channels: {
        settings: {
            characters: {
                beforeEmoji: '',
                afterEmoji: '・',
            },
            emojiPlacement: 'before-name',
            spaceReplacement: null
        },
        dev: {
            programming: '1403639419025752188'
        },
        mod: {
            info: '', logs: '1420416244825198673', assets: '',
            warnings: '1420416244825198673', modGeneral: '1420414794246131722',
            hallOfShame: '', eclairBotAlerts: '1420414794246131722', modCommands: ''
        },
        important: {
            lobby: '', rules: '', boosts: '', announcements: '',
        },
        general: {
            general: '1403639419025752188', media: '',
            commands: '', ei: '', offtopic: ''
        },
        other: {
            economy: '', minecraft: '', desktopPorn: '',
            communityPolls: ''
        },
        forfun: {
            counting: '', lastLetter: '', unfiltred: '',
            finishSentence: '', wordAssociation: ''
        },
        isolation: {
            isolationCell: ''
        },
        eclairbot: {
            email: '', stderr: '', stdout: '', stdwarn: '',
            dbBackups: ''
        },
        stats: {
            people: '1235591547437973557',
            goal: '1276862197099794514',
            bans: '1235591871020011540'
        }
    }
};
