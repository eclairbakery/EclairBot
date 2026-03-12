import { Config } from "@/bot/cfg.js";
import { hierarchyCfg } from "./hierarchy.js";
import { channelsCfg } from "./channels.js";
import { featuresConfig } from "./features.js";

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

        configuration: commandsCfg,
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

    features: featuresConfig,

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