import * as dsc from 'discord.js';
import { AnyCommandConfig, BlockCommandsRules, ConfigTranslation, Emoji, PermissionDefinitionConfig } from './subtypes.js';
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

    commands: {
        prefix: string,
        alternativePrefixes: string[],

        confirmUnsafeCommands: boolean;
        confirmDeprecatedCommands: boolean;

        blocking: {
            full: BlockCommandsRules;
            fullExceptImportant: BlockCommandsRules;
            spammy: BlockCommandsRules;
            economy: BlockCommandsRules;
            preferShortenedEmbeds: string[]
        },

        configuration: Record<string, AnyCommandConfig>,
        defaultConfiguration: AnyCommandConfig
    }

    database: {
        backups: {
            enabled: boolean;
            interval: number;
            msg: string;
        };

        path: string;
    }

    channels: {
        settings: {
            emojiPlacement: 'after-name' | 'before-name';
            characters: {
                beforeEmoji: string;
                afterEmoji: string;
            };
            /** can be null if none (default: -) */
            spaceReplacement: string | null;
        }

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
            }[];
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

        watchdog: {
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
    },

    emojis: {
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
}
