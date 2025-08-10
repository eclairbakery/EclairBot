import { Snowflake } from '../defs';
import { deepMerge } from '../util/objects';

import * as toml from 'toml';
import * as fs from 'fs';

export interface Config {
    /* Whether the bot is enabled (The most useless configuration field I've ever seen...) */
    enabled: boolean;

    general: {
        /* General configuration for the bot */
        prefix: string;
    };
    mod: {
        /* Configuration for moderation commands */
        commands: {
            ban: {
                /* Whether the ban command is enabled */
                enabled: boolean;
                /* Array of command aliases */
                aliases: string[];

                /* Array of role IDs that can execute the command */
                allowedRoles: Snowflake[] | null;
                /* Array of user IDs that can execute the command; everyone if null */
                allowedUsers: Snowflake[] | null;
                /* Whether a reason is required for the ban */
                reasonRequired: boolean;
            };
            kick: {
                /* Whether the kick command is enabled */
                enabled: boolean;
                /* Array of command aliases */
                aliases: string[];

                /* Array of role IDs that can execute the command */
                allowedRoles: Snowflake[] | null;
                /* Array of user IDs that can execute the command; everyone if null */
                allowedUsers: Snowflake[] | null;
                /* Whether a reason is required for the kick */
                reasonRequired: boolean;
            };
            mute: {
                /* Whether the mute command is enabled */
                enabled: boolean;
                /* Array of command aliases */
                aliases: string[];

                /* Array of role IDs that can execute the command */
                allowedRoles: Snowflake[] | null;
                /* Array of user IDs that can execute the command; everyone if null */
                allowedUsers: Snowflake[] | null;
                /* Whether a reason is required for the mute */
                reasonRequired: boolean;
            };
            warn: {
                /* Whether the warn command is enabled */
                enabled: boolean;
                /* Array of command aliases */
                aliases: string[];

                /* Array of role IDs that can execute the command */
                allowedRoles: Snowflake[];
                /* Array of user IDs that can execute the command; everyone if null */
                allowedUsers: Snowflake[] | null;
                /* Whether a reason is required for the warn */
                reasonRequired: boolean;
                /* Maximum points that can be given for a warn */
                maxPoints: number;
                /* Minimum points that can be given for a warn */
                minPoints: number;
            };
        };
    };
    logs: {
        /* Configuration for logging */
        enabled: boolean;
        /* Channel ID where logs will be sent */
        channelId: string;

        /* Array of channel IDs to ignore for logging */
        ignoredChannels: Snowflake[];
        /* Array of role IDs to ignore for logging */
        ignoredRoles: Snowflake[];
        /* Array of user IDs to ignore for logging */
        ignoredUsers: Snowflake[];
    };

    /* Economy configuration */
    economy: {
        /* Configuration for economy commands */
        commands: {
            ballance: {
                /* Whether the balance command is enabled */
                enabled: boolean;
                /* Array of command aliases */
                aliases: string[];

                /* Array of role IDs that can execute the command; everyone if null */
                allowedRoles: Snowflake[] | null;
                /* Array of user IDs that can execute the command; everyone if null */
                allowedUsers: Snowflake[] | null;
            };
            /* TODO */
        };

        /* Whether the economy system is enabled */
        enabled: boolean;

        /* On witch channels economy commands are allowed. All channels if null */
        allowedChannels: Snowflake[] | null;
    };
}

const defaultConfig: Config = {
    enabled: true,

    general: {
        prefix: '!',
    },

    mod: {
        commands: {
            ban: {
                enabled: true,
                aliases: ['ban'],
                allowedRoles: ['1403684128485806182'],
                allowedUsers: [],
                reasonRequired: false,
            },
            kick: {
                enabled: true,
                aliases: ['kick'],
                allowedRoles: ['1403684128485806182'],
                allowedUsers: [],
                reasonRequired: false,
            },
            mute: {
                enabled: true,
                aliases: ['mute'],
                allowedRoles: ['1403684128485806182'],
                allowedUsers: [],
                reasonRequired: false,
            },
            warn: {
                enabled: true,
                aliases: ['warn'],
                allowedRoles: ['1403684128485806182'],
                allowedUsers: [],
                reasonRequired: false,
                maxPoints: 30,
                minPoints: 1
            },
        },
    },

    logs: {
        enabled: false,
        channelId: '',
        ignoredChannels: [],
        ignoredRoles: [],
        ignoredUsers: [],
    },

    economy: {
        commands: {
            ballance: {
                enabled: true,
                aliases: ['balance', 'bal'],
                allowedRoles: [],
                allowedUsers: [],
            },
        },
        enabled: false,
        allowedChannels: [],
    },
};

function mergeConfigs(userCfg: Partial<Config>, defaultCfg: Config = defaultConfig): Config {
    return deepMerge(defaultCfg, userCfg);
}

export function loadConfig(path: string = './bot/config.toml'): Config {
    if (fs.existsSync(path)) {
        const content = fs.readFileSync(path, 'utf-8');
        const parsed = toml.parse(content);

        let userConfig: Partial<Config> = { ...parsed };
        return deepMerge(structuredClone(defaultConfig), userConfig);
    }

    return defaultConfig;
}
