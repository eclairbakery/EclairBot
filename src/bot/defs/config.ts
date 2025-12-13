export type Snowflake = `${number}`;

export interface BotConfig {
    channels: {
        /**
         * These are channels for logging actions within the bot 
         * and within the server.
        */
        logs: {
            stdout: Snowflake;
            stdwarn: Snowflake;
            stderr: Snowflake;
        }
    },
    features: {
        /**
         * Level configuration
        */
        leveling: {
            /**
             * How much XP is required to achieve second level.
             * 
             * Named levelDivider for historical reasons when the level was calculated like this:
             *  `xp / levelDivider`
            */
            levelDivider: number;
            /**
             * Determines whether to use a mention or an username to mention
             * people that have got a new level
             */
            shallPingWhenNewLevel: boolean;
            /**
             * An object that looks like this:
             *  `{2: 'role_id'}`
             * where `2` means the level on which the level is given
             * and `role_id` means the role id that is being given
             * when the user achieves a specific level.
             */
            milestoneRoles: Record<number, Snowflake>;
            /**
             * A channel where notifications about new people achieving a
             * new level are sent.
             */
            levelChannel: Snowflake;
            /**
             * The current event happening on specific channels
             * giving the user the ability to earn more there.
             */
            currentEvent: {
                enabled: boolean;
                channels: Snowflake[];
                multiplier: number;
            },
            /**
             * All the channels where the user is not eligible
             * to earn level.
             */
            excludedChannels: Snowflake[];
            /**
             * Base XP amount a user gets for one message
             */
            xpPerMessage: number;
        },
        /** Quote bot configuration */
        quoteBot: {
            excludedChannels: string[],
            strictlyExcludedChannels: string[],
            excludedCategories: string[]
        },
        /** Translations */
        translations: {
            input: string[] | string,
            output: string
        }[],
    }
}``