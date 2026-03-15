import * as dsc from 'discord.js';
import { AnyCommandConfig, BlockCommandsRules, Emoji, PermissionDefinitionConfig } from './subtypes.ts';
import { ConfigFeatures } from './features.ts';

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

    features: ConfigFeatures,

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
