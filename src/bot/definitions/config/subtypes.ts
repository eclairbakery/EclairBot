import * as dsc from 'discord.js';

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
}

export interface ConfigTranslation {
    input: string[] | string;
    output: string;
}

export interface RegexExpressionDefinition {
    regex: string;
    flags: `i` | undefined;
}

export interface ConfigCommandARgumentRulesForNumbers {
    allowInfinity: boolean;
    onlyIntegers: boolean;
}

////////////// command config base & commands ///////////////
export interface CommandConfigBase {
    enabled: boolean;
    aliases: string[];

    allowedUsers: dsc.Snowflake[] | null;
    allowedRoles: dsc.Snowflake[] | null;
    disallowedUsers?: dsc.Snowflake[];
    disallowedRoles?: dsc.Snowflake[];
    cooldownBypassUsers?: dsc.Snowflake[];
    cooldownBypassRoles?: dsc.Snowflake[];
}
export type AnyCommandConfig = CommandConfigBase & { [key: string]: any };

export interface ModCommandConfig extends CommandConfigBase {
    reasonRequired?: boolean;
}

export interface WarnCommandConfig extends ModCommandConfig {
    maxPoints: number;
    minPoints: number;
}

export interface IzolatkaCommandConfig extends CommandConfigBase {
    enabledForNormalAdministrators: boolean;
}

export interface CrimeCommandConfig extends CommandConfigBase {
    cooldown: number;
    minimumCrimeAmount: number;
    maximumCrimeAmount: number;
    successRatio: number;
}

////////////// command config map & categories ///////////////
export type CommandConfigMap = Record<string, AnyCommandConfig>;

export type ModCommandsConfigs = {
    ban: ModCommandConfig;
    kick: ModCommandConfig;
    mute: ModCommandConfig;
    warn: WarnCommandConfig;
    izolatka: IzolatkaCommandConfig;
    reset: CommandConfigBase;
} & CommandConfigMap;

export type EconomyCommandsConfig = {
    crime: CrimeCommandConfig;
} & CommandConfigMap;

////////////// permissions ///////////////
export interface PermissionDefinitionConfig {
    allowedUsers: dsc.Snowflake[];
    allowedRoles: dsc.Snowflake[];
}
