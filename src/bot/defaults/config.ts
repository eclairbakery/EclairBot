import { BotConfig } from "@/bot/defs/config.js";

export const defaultCfg: BotConfig = {
    channels: {
        logs: {
            stdout: "1419323394440167555",
            stderr: "1419323609419092019",
            stdwarn: "1448385153364656189"
        }
    },

    features: {
        leveling: {
            levelDivider: 100,
            shallPingWhenNewLevel: false,
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
        }
    }
};