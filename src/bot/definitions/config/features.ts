import * as dsc from 'discord.js';
import { ConfigTranslation } from './subtypes.ts';
import EconomyConfig from './economy.ts';

export interface ConfigFeatures {
    compilation: {
        replaceCompilerMap: Record<string, string[]>;
    };
    automod: {
        antiFloodEnabled: boolean;
        antiSpamEnabled: boolean;
    };
    welcomer: {
        enabled: boolean;
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
        };
        voice: {
            xpPerMinute: number;
            estimatedRealMembers: {
                requiredLevel: number;
                requiredPeople: number;
            };
        }
    };
    economy: EconomyConfig;
    email: {
        listenerChannel: dsc.Snowflake;
    };
    translations: ConfigTranslation[];
    watchdog: {
        kickNewMembers: boolean;
        allowNewBots: boolean;

        shallAutoDegrade: boolean;
        notForgiveAdministration: boolean;
        approveDangerousPermissions: boolean;

        limitsConfiguration: {
            maxMutes: number;
            maxWarns: number;
            maxChannelCreations: number;
            maxChannelDeletions: number;
        };
    };

    ai: {
        enabled: boolean;
        allowPolitics: boolean;
        allowPhilosophy: boolean;
        contextDefaultMessages: number;
        contextMaxMessages: number;
    };
    actions: {
        disabled: string[]
    }
}
