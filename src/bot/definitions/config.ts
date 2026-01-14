import { ChannelName } from '@/util/makeChannelName.js';
import * as dsc from 'discord.js';
import { BlockCommandsRules, ConfigEconomyShopItem, ConfigTranslation, Emoji, RegexExpressionDefinition } from './config-subtypes.js';

export interface Config {
    /* Whether the bot is enabled (The most useless configuration field I've ever seen...) */
    enabled: boolean;

    general: {
        /* General configuration for the bot */
        prefix: string;

        switchToProgrammingChance: number;

        databaseBackups: {
            enabled: boolean;
            interval: number;
            msg: string;
        };

        usingNormalHosting: boolean;
    };

    /* WARNING: Dev permissions allows doing many unsafe things and taking full control over the bot, so only give them to trusted people and the bot's developers! */
    devPerms: {
        allowedRoles: dsc.Snowflake[];
        allowedUsers: dsc.Snowflake[];
    };

    roles: {
        eclair25: dsc.Snowflake;
        secondLevelOwner: dsc.Snowflake;
        headAdmin: dsc.Snowflake;
        admin: dsc.Snowflake;
        headMod: dsc.Snowflake;
        mod: dsc.Snowflake;
        helper: dsc.Snowflake;

        automodBypassRoles: dsc.Snowflake[];
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
        channelNameWatchdog: {name: ChannelName, id: dsc.Snowflake}[];
    };

    blockCommands: {
        full: BlockCommandsRules;
        fullExceptImportant: BlockCommandsRules;
        spammy: BlockCommandsRules;
        economy: BlockCommandsRules;
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

    commands: {
        mod: {
            ban: {
                /* Whether the ban command is enabled */
                enabled: boolean;
                /* Array of command aliases */
                aliases: string[];

                /* Array of role IDs that can execute the command */
                allowedRoles: dsc.Snowflake[] | null;
                /* Array of user IDs that can execute the command; everyone if null */
                allowedUsers: dsc.Snowflake[] | null;
                /* Whether a reason is required for the ban */
                reasonRequired: boolean;
            };
            kick: {
                /* Whether the kick command is enabled */
                enabled: boolean;
                /* Array of command aliases */
                aliases: string[];

                /* Array of role IDs that can execute the command */
                allowedRoles: dsc.Snowflake[] | null;
                /* Array of user IDs that can execute the command; everyone if null */
                allowedUsers: dsc.Snowflake[] | null;
                /* Whether a reason is required for the kick */
                reasonRequired: boolean;
            };
            mute: {
                /* Whether the mute command is enabled */
                enabled: boolean;
                /* Array of command aliases */
                aliases: string[];

                /* Array of role IDs that can execute the command */
                allowedRoles: dsc.Snowflake[] | null;
                /* Array of user IDs that can execute the command; everyone if null */
                allowedUsers: dsc.Snowflake[] | null;
                /* Whether a reason is required for the mute */
                reasonRequired: boolean;
            };
            warn: {
                /* Whether the warn command is enabled */
                enabled: boolean;
                /* Array of command aliases */
                aliases: string[];

                /* Array of role IDs that can execute the command */
                allowedRoles: dsc.Snowflake[];
                /* Array of user IDs that can execute the command; everyone if null */
                allowedUsers: dsc.Snowflake[] | null;
                /* Whether a reason is required for the warn */
                reasonRequired: boolean;
                /* Maximum points that can be given for a warn */
                maxPoints: number;
                /* Minimum points that can be given for a warn */
                minPoints: number;
            };
            ping: {
                enabled: boolean;
                allowedRoles: dsc.Snowflake[];
                deathChatRenewInterval: number;
                eclairNewsRenewInterval: number;
            };
            izolatka: {
                enabled: boolean;
                enabledForNormalAdministrators: boolean;
            }
        },
        customs: Record<string, { enabled: boolean, [key: string]: any }>,
        defConf: {
            enabled: boolean
        }
    };

    customization: {
        modTexts: {
            userIsProtectedHeader: string;
            userIsProtectedDesc: string;
            reasonRequiredNotSpecifiedHeader: string;
            reasonRequiredNotSpecifiedText: string;
            defaultReason: string;
            havingMentalProblemsByWarningYourselfHeader: string;
            havingMentalProblemsByWarningYourselfText: string;
            warningEclairBotReason: string;
            warningWatchdogReason: string;
            warnHeader: string;
            shitwarnHeader: string;
            warnDescription: string;
            noTargetSpecifiedHeader: string;
            noTargetSpecifiedText: string;
        },
        evalWarnings: {
            consoleLogWarn: string;
            doNotDownloadDatabase: string;
            execReturnWarn: string;
            unsafeEval: string;
            wait: string;
            waitRestart: string;
            gonnaRestart: string;
        },
        commandsErrors: {
            legacy: {
                commandDisabledHeader: string;
                commandDisabledDescription: string;
                doesNotWorkInDmHeader: string;
                doesNotWorkInDmText: string;
                missingPermissionsHeader: string;
                missingPermissionsText: string;
                commandNotFoundHeader: string;
                commandNotFoundText: string;
            },
            slash: {
                notAllowedInDm: string;
                commandIsDisabled: string;
                commandNotFound: string;
                missingPermissions: string;
            }
        },
        economyTexts: {
            betWrongAmountHeader: string;
            betWrongAmountText: string;
            balanceNotSufficientHeader: string;
            balanceNotSufficientText: string;
            bankBalanceNotSufficientText: string;
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
        }
    };

    masterSecurity: {
        /** if true, watchNewMember will always return true (trustworthy) */
        trustNewMembers: boolean;
        /** if enabled, bot will kick out every new member */
        fuckNewMembers: boolean;
        /** lighter version of cfg.masterSecurity.fuckNewMembers which moves users to the isolation cell instead */
        fuckNewMembersLight: boolean;
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
            generalLevelBoost: {
                enabled: boolean,
                boostTimeInMinutes: number,
                generalActivityMeterRefreshInMinutes: number
            },
            multipliers: {
                role: dsc.Snowflake;
                multiplier: number;
            } [];
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
        ai: {
            enabled: boolean;
            channel: dsc.Snowflake;
            notAllowedCharacters: string[];
            bannedSequences: string[];
        };
        economy: {
            shop: ConfigEconomyShopItem[];
            currencySign: string;
            currencySignPlacement: 'left' | 'right';

            commandSettings: {
                crime: {
                    cooldown: number;
                    minimumCrimeAmount: number;
                    maximumCrimeAmount: number;
                    successRatio: number;
                }
            }
        },
        moderation: {
            protectedRoles: dsc.Snowflake[];
            warnAutoActions: {
                type: 'mute' | 'kick' | 'ban';
                duration?: number;
                reason: string;
                activationPointsNumber: number;
            }[];
        },
        translations: ConfigTranslation[],
        generalFiltering: {
            regex: RegexExpressionDefinition,
            enabled: boolean,
            leet_map: Record<string, string>
        }
    }
}