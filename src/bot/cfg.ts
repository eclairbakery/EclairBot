import * as dsc from 'discord.js';
import JSON5 from 'json5';

import { deepMerge } from '@/util/objects.js';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { output } from './logging.js';
import { client } from '@/client.js';
import { ChannelName } from '@/util/makeChannelName.js';

export type BlockCommandsRules = {
    default: 'block';
    allow: dsc.Snowflake[];
} | {
    default: 'allow';
    deny: dsc.Snowflake[];
};

export interface Emoji {
    name: string;
    id: dsc.Snowflake;
};

export interface Config {
    /* Whether the bot is enabled (The most useless configuration field I've ever seen...) */
    enabled: boolean;

    general: {
        /* General configuration for the bot */
        prefix: string;

        /* Experience configuration */
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
            }
        };

        /* The welcomer configuration */
        welcomer: {
            enabled: boolean;
            channelId: string;
            general: dsc.Snowflake;
        };

        forFun: {
            media: {
                addReactions: string[];
                deleteMessageIfNotMedia: boolean;
                channel: dsc.Snowflake;
                shallCreateThread: boolean;
            } [],
            lastLetterChannel: dsc.Snowflake;
            countingChannel: dsc.Snowflake;
        };

        moderationProtectedRoles: dsc.Snowflake[];
        hallOfFame: dsc.Snowflake;
        hallOfFameEligibleChannels: dsc.Snowflake[];
        hallOfFameEnabled: boolean;
    };

    /* WARNING: Dev permissions allow doing many unsafe things and taking full control over the bot, so only give them to trusted people and the bot's developers! */
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
            '0/4': Emoji;
            '1/4': Emoji;
            '2/4': Emoji;
            '3/4': Emoji;
        };
    };


    cheatsRoles: {
        automodBypassRoles: dsc.Snowflake[];
    };

    logs: {
        channel: dsc.Snowflake;
        stdout: dsc.Snowflake;
        stderr: dsc.Snowflake;
    };

    ai: {
        enabled: boolean;
        channel: dsc.Snowflake;
        notAllowedCharacters: string[];
        modelPath: string;
        aiTokensLimit: number;
        bannedSequences: string[];
        unlimitedAiRole: dsc.Snowflake[];
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
        eligibleToRemoveGifBan: dsc.Snowflake[];
        gifBan: dsc.Snowflake;
        unfilteredChannel: dsc.Snowflake;
        makeNeocities: dsc.Snowflake[];
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
                allowedRoles: dsc.Snowflake[];
                deathChatRenewInterval: number;
                eclairNewsRenewInterval: number;
            };
            izolatka: {
                enabledForNormalAdministrators: boolean;
            }
        };
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
        shallAutoDegrade: boolean;
    }
}

const rolesCfg: Config['roles'] = {
    eclair25: '1280081773019140096',
    secondLevelOwner: '1280884378586845216',
    headAdmin: '1415710955022843904',
    admin: '1415710969732005980',
    headMod: '1415710973288910919',
    mod: '1415710976644349972',
    helper: '1415710980612034771'
};   
     
const channelsCfg: Config['channels'] = {
    mod: {
        modGeneral: '1235552454838456433',
        logs: '1235641912241819669',
        warnings: '1305591940821028884',
        hallOfShame: '1290327060970995812',
        modCommands: '1392787737962090596',
        info: '1390389554623549641',
        assets: '1404396223934369844',
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
    },
    dev: {
        programming: '1422241324819550381'
    }
};

const defaultCfg: Config = {
    enabled: true,

    roles: rolesCfg,
    channels: channelsCfg,
    channelsConfiguration: {
        channelNameWatchdog: [
            {
                name: {
                    name: 'yapping',
                    emoji: '💬',
                    leaveSpaces: false
                },
                id: '1264971505662689311'
            }
        ],
        characters: {
            beforeEmoji: '﹝',
            afterEmoji: '﹞'
        },
        emojiPlacement: 'before-name',
        spaceReplacement: null
    },

    general: {
        prefix: 'sudo ',
        leveling: {
            xpPerMessage: 4,
            levelDivider: 100,
            excludedChannels: [],
            canChangeXP: ['1404392144441180221', rolesCfg.eclair25, rolesCfg.secondLevelOwner],
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
                channels: [ channelsCfg.dev.programming ],
                multiplier: 2
            }
        },

        hallOfFame: '1392128976574484592',
        hallOfFameEligibleChannels: [channelsCfg.general.general, channelsCfg.general.offtopic, channelsCfg.general.media, channelsCfg.mod.hallOfShame],
        hallOfFameEnabled: false,
        
        welcomer: {
            channelId: "1235560269871190056",
            enabled: true,
            general: channelsCfg.general.general,
        },

        moderationProtectedRoles: [],
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
        }
    },

    emoji: {
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
    },

    devPerms: {
        allowedRoles: [],
        allowedUsers: ['1368171061585117224', '990959984005222410', '985053803151753316', '1274610053843783768', '1401568817766862899'],
    },


    blockCommands: {
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
    },

    logs: {
        channel: channelsCfg.mod.logs,
        stdout: channelsCfg.eclairbot.stdout,
        stderr: channelsCfg.eclairbot.stderr,
    },


    cheatsRoles: {
        automodBypassRoles: ['1380875827998097418'],
    },

    unfilteredRelated: {
        eligibleToRemoveGifBan: [rolesCfg.eclair25, rolesCfg.secondLevelOwner],
        gifBan: "1406369089634435204",
        unfilteredChannel: channelsCfg.forfun.unfiltred,
        makeNeocities: [],
    },

    ai: {
        enabled: false,
        channel: '1276271917665484801',
        //channel: '1406643477210726550',
        notAllowedCharacters: [':', '#', '!', '&', '*'],
        modelPath: '@/bot/eclairai-db.json',
        aiTokensLimit: 100, // believe me it's a lot, you won't get more if you're not flooding
        bannedSequences: ['@here', '@everyone', 'choler', 'chuj', 'debil', 'fiucie', 'fiut', 'fuck', 'gówn', 'hitler', 'ja pierdole', 'ja pierdolę', 'jeba', 'jebany', 'jebi', 'jprdl', 'kurwa', 'kutas', 'niger', 'nigger', 'penis', 'pierdol', 'porn', 'putin', 'rucha', 'skibidi', 'skibidi toilet', 'spierdalaj', 'toilet', 'wypierdalaj', 'zapierdalaj'],
        unlimitedAiRole: ['1235594078305914880', '1235594081556627577', '1235594083544858667', '1235594085188767835', '1390802440739356762', '1255213321301524643'],
        temperature: 0.5, // this is a lot... i need to decrease this
        pretrainedSuggestions: { "siema": ["witam, w czym mogę zepsuć"], "ile to": ["co ty myslisz że ja matematyk"], "witaj": ["witam bardzo średnioserdecznie"], "jaka pogoda": ["wyjrzyj za okno"] },
        memoryLimit: 15,
        hiddenSize: 32,
        embeddingSize: 16,
    },

    mod: {
        commands: {
            ban: {
                enabled: true,
                aliases: [],
                allowedRoles: [rolesCfg.eclair25, rolesCfg.secondLevelOwner, rolesCfg.headAdmin, rolesCfg.admin, rolesCfg.headMod],
                allowedUsers: [],
                reasonRequired: false,
            },
            kick: {
                enabled: true,
                aliases: [],
                allowedRoles: [rolesCfg.eclair25, rolesCfg.secondLevelOwner, rolesCfg.headAdmin, rolesCfg.admin, rolesCfg.headMod],
                allowedUsers: [],
                reasonRequired: false,
            },
            mute: {
                enabled: true,
                aliases: [],
                allowedRoles: [rolesCfg.eclair25, rolesCfg.secondLevelOwner, rolesCfg.headAdmin, rolesCfg.admin, rolesCfg.headMod, rolesCfg.mod, rolesCfg.helper],
                allowedUsers: [],
                reasonRequired: false,
            },
            warn: {
                enabled: true,
                aliases: [],
                allowedRoles: [rolesCfg.eclair25, rolesCfg.secondLevelOwner, rolesCfg.headAdmin, rolesCfg.admin, rolesCfg.headMod, rolesCfg.mod, rolesCfg.helper],
                allowedUsers: [],
                reasonRequired: false,
                maxPoints: 30,
                minPoints: 1,
            },
            ping: {
                allowedRoles: [rolesCfg.eclair25, rolesCfg.secondLevelOwner, rolesCfg.headAdmin, rolesCfg.admin],
                deathChatRenewInterval: 2 * 60 * 60 * 1000,
                eclairNewsRenewInterval: 6 * 60 * 60 * 1000,
            },
            izolatka: {
                enabledForNormalAdministrators: true
            }
        },
    },

    masterSecurity: {
        trustNewMembers: false,
        fuckNewMembers: false,
        minimumAccountAge: 3,
        massJoinWindow: 10 * 60 * 1000,
        massJoinThreshold: 5,
        similarityThreshold: 3,
        allowNewBots: false,
        shallAutoDegrade: true
    }
};

export let overrideCfg: Config = null;

function readConfigurationChanges() {
    if (!existsSync('bot/config.js')) return {};
    let file = readFileSync('bot/config.js', 'utf-8');
    file = file.trim();
    while (file.startsWith('(')) file = file.slice(1);
    while (file.endsWith(')')) file = file.slice(0, -1);
    return JSON5.parse(file);
}

export function saveConfigurationChanges() {
    writeFileSync('bot/config.js', `(${JSON5.stringify(overrideCfg, null, 4)})`, 'utf-8');
}

function makeConfig(): Config {
    overrideCfg = readConfigurationChanges();
    return deepMerge(defaultCfg, overrideCfg);
};

export const cfg = makeConfig();