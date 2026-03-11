import { Config } from "@/bot/cfg.js";
import { defaultLegacyCfg } from "./legacy.js";

export const defaultCfg: Config = {
    /** @deprecated */
    legacy: defaultLegacyCfg,

    hierarchy: {
        developers: {
            allowedRoles: [
                "1280081773019140096"
            ],
            allowedUsers: [
                "1368171061585117224",
                "990959984005222410",
                "985053803151753316",
                "1274610053843783768",
                "1401568817766862899"
            ]
        },

        administration: {
            eclair25: '1280081773019140096',
            headAdmin: '1415710955022843904',
            admin: '1415710969732005980',
            headMod: '1415710973288910919',
            mod: '1415710976644349972',
            helper: '1415710980612034771'
        },

        automodBypassRoles: ['1380875827998097418'],
    }
};