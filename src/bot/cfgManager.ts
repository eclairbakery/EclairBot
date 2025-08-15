import { Snowflake } from '../defs.js';
import { deepMerge } from '../util/objects.js';

import * as toml from 'toml';
import * as fs from 'fs';

export interface Config {
    /* Whether the bot is enabled (The most useless configuration field I've ever seen...) */
    enabled: boolean;

    radio: {
        enabled: boolean;
        default_playlist: string[],
        piekarnia_ad: string,
        radio_channel: Snowflake
    },

    general: {
        /* General configuration for the bot */
        prefix: string;
        /* Experience configuration */
        leveling: {
            xp_per_message: number;
            level_divider: number;
            excludedChannels: string[];
            milestone_roles: {[key: number]: Snowflake};
            canChangeXP: Snowflake[];
        },
        /* The welcomer configuration */
        welcomer: {
            enabled: boolean;
            channelId: string;
            general: Snowflake;
        },
        blockedChannels: Snowflake[],
        commandsExcludedFromBlockedChannels: string[],
        moderationProtectedRoles: Snowflake[]
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
}

const defaultConfig: Config = {
    enabled: true,

    radio: {
        enabled: false,
        default_playlist: [
            'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            'https://www.youtube.com/watch?v=iqoNoU-rm14',
            'https://www.youtube.com/watch?v=D-TQB-T-UJ4',
            'https://www.youtube.com/watch?v=3BR7-AzE2dQ',
            'https://www.youtube.com/watch?v=BqCUsPkouUU',
            'https://www.youtube.com/watch?v=0E6KXgWuaHo',
            'https://www.youtube.com/watch?v=EZUPEoj3Qjs',
            'https://www.youtube.com/watch?v=mj9KRKSvdbk',
            'https://www.youtube.com/watch?v=B7xai5u_tnk',
            'https://www.youtube.com/watch?v=VFwmKL5OL-Q',
            'https://www.youtube.com/watch?v=ALkNSrtIPXc',
            'https://www.youtube.com/watch?v=DHsNaulyQw8',
            'https://www.youtube.com/watch?v=GNwd1qXt3RI',
            'https://www.youtube.com/watch?v=BByMzI1YjKA',
            'https://www.youtube.com/watch?v=zscd5xcu6cm',
            'https://www.youtube.com/watch?v=pKqVj-ermPY',
            'https://www.youtube.com/watch?v=2up_Eq6r6Ko',
            'https://www.youtube.com/watch?v=60ItHLz5WEA'
        ],
        radio_channel: '1404793848542007308',
        piekarnia_ad: '💎 Szukasz radia na swój serwer Discord? Skontaktuj się z administratorami Piekarnii Eklerki: <https://discord.gg/aEyZS3nMDE>'
    },

    general: {
        prefix: '!',
        leveling: {
            // leave it like it was in startIT
            xp_per_message: 4,
            level_divider: 100,
            excludedChannels: [],
            canChangeXP: ['1280884378586845216', '1280081773019140096', '1404392144441180221'],
            milestone_roles: {
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
        },
        blockedChannels: ['1264971505662689311', '1392567715407073402'],
        commandsExcludedFromBlockedChannels: ['ban', 'mute', 'warn', 'kick', 'warnlist', 'warn-clear', 'cat', 'dog'],
        welcomer: {
            channelId: "1235560269871190056",
            enabled: true,
            general: '1264971505662689311'
        },
        moderationProtectedRoles: ['1280884378586845216', '1280081773019140096']
    },

    mod: {
        commands: {
            ban: {
                enabled: true,
                aliases: ['ban'],
                allowedRoles: ['1235546046562697278', '1271533062156713994', '1274478730697510997', '1280884378586845216', '1280081773019140096'],
                allowedUsers: [],
                reasonRequired: false,
            },
            kick: {
                enabled: true,
                aliases: ['kick'],
                allowedRoles: ['1235546046562697278', '1271533062156713994', '1274478730697510997', '1280884378586845216', '1280081773019140096'],
                allowedUsers: [],
                reasonRequired: false,
            },
            mute: {
                enabled: true,
                aliases: ['mute'],
                allowedRoles: ['1235546046562697278', '1271533062156713994', '1274478730697510997', '1280884378586845216', '1280081773019140096'],
                allowedUsers: [],
                reasonRequired: false,
            },
            warn: {
                enabled: true,
                aliases: ['warn'],
                allowedRoles: ['1235546046562697278', '1271533062156713994', '1274478730697510997', '1280884378586845216', '1280081773019140096'],
                allowedUsers: [],
                reasonRequired: false,
                maxPoints: 30,
                minPoints: 1
            },
        },
    }
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
