export type Snowflake = `${number}`;

export interface BotConfig {
    channels: {
        logs: {
            stdout: Snowflake;
            stdwarn: Snowflake;
            stderr: Snowflake;
        }
    }
}``