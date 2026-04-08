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
    hallOfFame: {
        enabled: boolean;
        channel: dsc.Snowflake;
        eligibleChannels: dsc.Snowflake[];
    };
    economy: EconomyConfig;
    email: {
        listenerChannel: dsc.Snowflake;
    };
    translations: ConfigTranslation[];
    watchdog: {
        trustNewMembers: boolean;
        kickNewMembers: boolean;
        allowNewBots: boolean;
        minimumAccountAge: number;

        massJoinWindow: number;
        massJoinThreshold: number;
        similarityThreshold: number;

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
        allowPolitics: boolean;
        allowPhilosophy: boolean;
        contextDefaultMessages: number;
        contextMaxMessages: number;
    };
}
