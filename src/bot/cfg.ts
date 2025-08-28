import { Snowflake } from '../defs.js';
import { deepMerge } from '../util/objects.js';

export interface Config {
    /* Whether the bot is enabled (The most useless configuration field I've ever seen...) */
    enabled: boolean;

    radio: {
        enabled: boolean;
        defaultPlaylist: string[],
        piekarniaAD: string,
        radioChannel: Snowflake
    };

    general: {
        /* General configuration for the bot */
        prefix: string;
        /* Experience configuration */
        leveling: {
            xpPerMessage: number;
            levelDivider: number;
            excludedChannels: string[];
            milestone_roles: { [key: number]: Snowflake };
            canChangeXP: Snowflake[];
            levelChannel: Snowflake;
            shallPingWhenNewLevel: boolean;
        },
        /* The welcomer configuration */
        welcomer: {
            enabled: boolean;
            channelId: string;
            general: Snowflake;
        },
        blockedChannels: Snowflake[],
        commandsExcludedFromBlockedChannels: string[],
        moderationProtectedRoles: Snowflake[],
        hallOfFame: Snowflake,
        hallOfFameEligibleChannels: Snowflake[]
    };

    cheatsRoles: {
        automodBypassRoles: Snowflake[];
    },

    logs: {
        channel: Snowflake
    },

    ai: {
        channel: Snowflake;
        allowedCharacters: string[];
        modelPath: string;
        aiTokensLimit: number;
        bannedSequences: string[];
        unlimitedAiRole: Snowflake[];
        /**
         * This determines how the model is going to react
         * to pretrained hints. Setting it to a lower value
         * involves model's "imagination" and setting it to
         * a bigger value means it's send the exact same thing
         * that it was trained to.
         *
         * Remember that model trains on pretrained hints, this
         * makes some probability, that the pretrained suggestion
         * will be printed, even in **0** state (100% "imagination").
         *
         * **1** - it's going to reply the exact thing
         *
         * **0** - it's going to generate random thing
         *         and ignore the hint
         *
         * I suggest setting it to a float like 0.5, even 0.4.
         */
        temperature: number;
        pretrainedSuggestions: Record<string, string[]>;
        memoryLimit: number;
        embeddingSize: number;
        hiddenSize: number;
    };

    unfilteredRelated: {
        eligibleToRemoveGifBan: Snowflake[],
        gifBan: Snowflake,
        unfilteredChannel: Snowflake,
        makeNeocities: Snowflake
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

export const cfg: Config = {
    enabled: true,

    logs: {
        channel: '1235641912241819669'
    },

    radio: {
        enabled: false,
        defaultPlaylist: [
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
        radioChannel: '1404793848542007308',
        piekarniaAD: '💎 Szukasz radia na swój serwer Discord? Skontaktuj się z administratorami Piekarnii Eklerki: <https://discord.gg/aEyZS3nMDE>'
    },

    cheatsRoles: {
        automodBypassRoles: ['1380875827998097418'],
    },

    general: {
        prefix: 'sudo ',
        leveling: {
            // leave it like it was in startIT
            xpPerMessage: 4,
            levelDivider: 100,
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
            levelChannel: '1235592947831930993',
            shallPingWhenNewLevel: false
        },
        hallOfFame: '1392128976574484592',
        hallOfFameEligibleChannels: ['1397628186795311246', '1264971505662689311', '1342793182265741394', '1392567715407073402'],
        blockedChannels: ['1264971505662689311', '1392567715407073402'],
        commandsExcludedFromBlockedChannels: ['ban', 'mute', 'unmute', 'warn', 'kick', 'warnlist', 'warn-clear', 'cat', 'dog', 'parrot', 'animal', 'xp', 'shitwarn', 'clear', 'wiki'],
        welcomer: {
            channelId: "1235560269871190056",
            enabled: true,
            general: '1264971505662689311'
        },
        moderationProtectedRoles: ['1280884378586845216', '1280081773019140096'],
    },

    unfilteredRelated: {
        eligibleToRemoveGifBan: ["1280081773019140096", "1280884378586845216"],
        gifBan: "1406369089634435204",
        unfilteredChannel: '1397628186795311246',
        makeNeocities: '1409824205712920576'
    },

    ai: {
        channel: '1276271917665484801',
        //channel: '1406643477210726550',
        allowedCharacters: [/* lowercase*/ 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'r', 's', 't', 'u', 'w', 'x', 'y', 'z', /* uppercase */ 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'T', 'U', 'W', 'X', 'Y', 'Z' /* polish characters */, 'ą', 'ę', 'ć', 'ś', 'ó', 'ł', 'ż', 'ź', 'Ą', 'Ę', 'Ć', 'Ś', 'Ó', 'Ł', 'Ż', 'Ź', /* common characters */, ',', '.', ';', ' ', ':'],
        modelPath: './bot/eclairai-db.json',
        aiTokensLimit: 100, // believe me it's a lot, you won't get more if you're not flooding
        bannedSequences: ['@here', '@everyone', 'choler', 'chuj', 'debil', 'fiucie', 'fiut', 'fuck', 'gówn', 'hitler', 'ja pierdole', 'ja pierdolę', 'jeba', 'jebany', 'jebi', 'jprdl', 'kurwa', 'kutas', 'niger', 'nigger', 'penis', 'pierdol', 'porn', 'putin', 'rucha', 'skibidi', 'skibidi toilet', 'spierdalaj', 'toilet', 'wypierdalaj', 'zapierdalaj'],
        unlimitedAiRole: ['1235594078305914880', '1235594081556627577', '1235594083544858667', '1235594085188767835', '1390802440739356762', '1255213321301524643'],
        temperature: 0.5, // this is a lot... i need to decrease this
        pretrainedSuggestions: { "siema": ["witam, w czym mogę zepsuć"], "ile to": ["co ty myslisz że ja matematyk"], "witaj": ["witam bardzo średnioserdecznie"], "jaka pogoda": ["wyjrzyj za okno"] },
        memoryLimit: 15,
        hiddenSize: 32,
        embeddingSize: 16
    },

    mod: {
        commands: {
            ban: {
                enabled: true,
                aliases: [],
                allowedRoles: ['1235546046562697278', '1271533062156713994', '1274478730697510997', '1280884378586845216', '1280081773019140096'],
                allowedUsers: [],
                reasonRequired: false,
            },
            kick: {
                enabled: true,
                aliases: [],
                allowedRoles: ['1235546046562697278', '1271533062156713994', '1274478730697510997', '1280884378586845216', '1280081773019140096'],
                allowedUsers: ['1274610053843783768'],
                reasonRequired: false,
            },
            mute: {
                enabled: true,
                aliases: [],
                allowedRoles: ['1235546046562697278', '1271533062156713994', '1274478730697510997', '1280884378586845216', '1280081773019140096'],
                allowedUsers: [],
                reasonRequired: false,
            },
            warn: {
                enabled: true,
                aliases: [],
                allowedRoles: ['1235546046562697278', '1271533062156713994', '1274478730697510997', '1280884378586845216', '1280081773019140096', '1403684128485806182'],
                allowedUsers: [],
                reasonRequired: false,
                maxPoints: 30,
                minPoints: 1,
            },
        },
    },
};