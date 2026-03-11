import * as dsc from 'discord.js';
import {
    BlockCommandsRules, ConfigCommandARgumentRulesForNumbers,
    ConfigTranslation, Emoji, CommandConfigMap, ModCommandsConfigs,
    AnyCommandConfig,
    EconomyCommandsConfig,
    PermissionDefinitionConfig
} from './config-subtypes.js';

import EconomyConfig from './economy.js';

export interface Config {
    hierarchy: {
        developers: PermissionDefinitionConfig,
        
        administration: {
            eclair25: dsc.Snowflake;
            headAdmin: dsc.Snowflake;
            admin: dsc.Snowflake;
            headMod: dsc.Snowflake;
            mod: dsc.Snowflake;
            helper: dsc.Snowflake;
        },

        automodBypassRoles: dsc.Snowflake[];
    },

legacy: {
    /* Whether the bot is enabled (The most useless configuration field I've ever seen...) */
    enabled: boolean;

    general: {
        /* General configuration for the bot */
        prefix: string;
        alternativePrefixes: string[];

        commandHandling: {
            confirmUnsafeCommands: boolean;
            confirmDeprecatedCommands: boolean;
            arguments: {
                number: ConfigCommandARgumentRulesForNumbers & {
                    commandOverrides: Record<string, ConfigCommandARgumentRulesForNumbers>
                }
            }
        },

        databaseBackups: {
            enabled: boolean;
            interval: number;
            msg: string;
        };

        usingNormalHosting: boolean;
    };

    channels: {
        mod: {
            modGeneral: dsc.Snowflake;
            logs: dsc.Snowflake;
            warnings: dsc.Snowflake;
            hallOfShame: dsc.Snowflake;
            modCommands: dsc.Snowflake;
            info: dsc.Snowflake;
            assets: dsc.Snowflake;
            eclairBotAlerts: dsc.Snowflake;
        };
        important: {
            lobby: dsc.Snowflake;
            rules: dsc.Snowflake;
            announcements: dsc.Snowflake;
            boosts: dsc.Snowflake;
        };
        general: {
            general: dsc.Snowflake;
            offtopic: dsc.Snowflake;
            commands: dsc.Snowflake;
            media: dsc.Snowflake;
        };
        dev: {
            programming: dsc.Snowflake;
        };
        other: {
            communityPolls: dsc.Snowflake;
            desktopPorn: dsc.Snowflake;
            minecraft: dsc.Snowflake;
            economy: dsc.Snowflake;
        };
        forfun: {
            counting: dsc.Snowflake;
            lastLetter: dsc.Snowflake;
            finishSentence: dsc.Snowflake;
            wordAssociation: dsc.Snowflake;
            unfiltred: dsc.Snowflake;
        };
        isolation: {
            isolationCell: dsc.Snowflake;
        };
        eclairbot: {
            stdout: dsc.Snowflake;
            stderr: dsc.Snowflake;
            stdwarn: dsc.Snowflake;
            email: dsc.Snowflake;
            dbBackups: dsc.Snowflake;
        };
    };

    channelsConfiguration: {
        emojiPlacement: 'after-name' | 'before-name';
        characters: {
            beforeEmoji: string;
            afterEmoji: string;
        };
        /** can be null if none (default: -) */
        spaceReplacement: string | null;
    };

    blockCommands: {
        full: BlockCommandsRules;
        fullExceptImportant: BlockCommandsRules;
        spammy: BlockCommandsRules;
        economy: BlockCommandsRules;
        preferShortenedEmbeds: string[]
    };

    ping: {
        enabled: boolean;
        deathChatRenewInterval: number;
        eclairNewsRenewInterval: number;
    };

    emoji: {
        darkRedBlock: Emoji;
        lightRedBlock: Emoji;
        darkGreenBlock: Emoji;
        lightGreenBlock: Emoji;

        circleProgressBar: {
            [key: `${number}/4`]: Emoji;
        };

        idkEmoji: Emoji;
        wowEmoji: Emoji;
        sadEmoji: Emoji;
        heartAttackEmoji: Emoji;
    };

    unfilteredRelated: {
        gifBan: dsc.Snowflake;
        unfilteredChannel: dsc.Snowflake;
    };

    defaultCommandConfig: AnyCommandConfig;
    commands: {
        mod: ModCommandsConfigs;
        economy: EconomyCommandsConfig;
        [category: string]: CommandConfigMap;
    };

    customization: {
        economyTexts: {
            blackjack: {
                title: string,
                descriptionWin: string,
                descriptionLose: string,
                descriptionDraw: string,
                descriptionTimeout: string,
                descriptionBust: string,
            }
            playerCardsLabel: string,
            dealerCardsLabel: string,
            workSlutOrCrime: {
                crime: {
                    waitTextHeader: string,
                    waitTextDescription: `${string}<seconds>${string}`,
                    crimeNotAllowedHeader: string,
                    crimeNotAllowedText: string,
                    winHeader: string,
                    loseHeader: string,
                    winText: `${string}<amount>${string}`,
                    loseText: `${string}<amount>${string}`
                }
            },
            robbing: {
                waitHeader: string,
                waitText: `${string}<seconds>${string}`
            }
        },
        uncategorized: {
            gifWrongApiKey: string;
            gifNotFound: string;
            gifErrorString: string;
            wikiUnknownArticleHeader: string;
            wikiUnknownArticleText: string;
            wikiIsNotFandomHeader: string;
            wikiIsNotFandomText: string;
            wikiDisambiguationPageHeader: string;
            wikiDisambiguationPageText: string;
            fandomDefaultQueryText: string;
            fandomArticleNotFoundHeader: string;
            fandomArticleNotFoundText: string;
        },
        watchdogTexts: {
            fatalHeader: string;
            suspiciousHeader: string;
            descStart: string;
            descEnd: {
                reputation: string;
                pingSorry: string;
                floodSorry: string;
            },
            newBotsAddition: {
                gayBotSentence: string;
                firstSentence: string;
                secondSentence: string;
                remReason: string;
            },
            susThings: {
                freshAccount: string;
                youngAccount: string;
                noAvatar: string;
                susName: string;
                gayBot: string;
                raid: string;
                similarUsername: string;
                defaultIssue: string;
            }
        },
        stringifyEmbed: boolean
    };

    masterSecurity: {
        /** if true, watchNewMember will always return true (trustworthy) */
        trustNewMembers: boolean;
        /** if enabled, bot will kick out every new member */
        fuckNewMembers: boolean;
        /** minimum account age in days, can be set to 0 to disable this check */
        minimumAccountAge: number;
        massJoinWindow: number;
        massJoinThreshold: number;
        similarityThreshold: number;
        allowNewBots: boolean;
        /** master switch for most of the watchdog security features */
        shallAutoDegrade: boolean;
        /** if this is enabled, eclairbot will ensure to remove EVERY SINGLE ONE of administration roles to the member that has violated watchdog rules; if disabled it'll just degrade that person by one role */
        notForgiveAdministration: boolean;
        approveDangerousPermissions: boolean;
        limitsConfiguration: {
            maxMutes: number;
            maxWarns: number;
            maxChannelCreations: number;
            maxChannelDeletions: number;
        };
    },

    features: {
        compilation: {
            replaceCompilerMap: Record<string, string>
        },
        automod: {
            antiFloodEnabled: boolean;
            antiSpamEnabled: boolean;
        };
        welcomer: {
            enabled: boolean;
            channelId: dsc.Snowflake;
            general: dsc.Snowflake;
            mentionNewPeopleInLobby: boolean;
            welcomeMsgs: `${string}<mention>${string}`[];
            goodbyeMsgs: `${string}<mention>${string}`[];
            freeRolesForEveryone: `${number}`[];
        };
        forFun: {
            media: {
                addReactions: string[];
                deleteMessageIfNotMedia: boolean;
                channel: dsc.Snowflake;
                shallCreateThread: boolean;
            } [];
            lastLetterChannel: dsc.Snowflake;
            countingChannel: dsc.Snowflake;
        };
        leveling: {
            xpPerMessage: number;
            levelDivider: number;
            excludedChannels: string[];
            milestoneRoles: Record<number, dsc.Snowflake>;
            canChangeXP: dsc.Snowflake[];
            levelChannel: dsc.Snowflake;
            shallPingWhenNewLevel: boolean;
            currentEvent: {
                enabled: boolean;
                channels: dsc.Snowflake[];
                multiplier: number;
            },
        };
        hallOfFame: {
            enabled: boolean;
            channel: dsc.Snowflake;
            eligibleChannels: dsc.Snowflake[];
        },
        logs: {
            channel: dsc.Snowflake;
            stdout: dsc.Snowflake;
            stderr: dsc.Snowflake;
            stdwarn: dsc.Snowflake;
        };
        economy: EconomyConfig;
        moderation: {
            protectedRoles: dsc.Snowflake[];
            warnAutoActions: {
                type: 'mute' | 'kick' | 'ban';
                duration?: number;
                reason: string;
                activationPointsNumber: number;
            }[];
        },
        email: {
            listenerChannel: dsc.Snowflake;
        };
        translations: ConfigTranslation[],
    }
}
}
