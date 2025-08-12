import * as dsc from 'discord.js';

export const client = new dsc.Client({
    intents: [
        dsc.GatewayIntentBits.DirectMessages,
        dsc.GatewayIntentBits.GuildMessages,
        dsc.GatewayIntentBits.MessageContent,
        dsc.GatewayIntentBits.GuildModeration,
        dsc.GatewayIntentBits.Guilds,
        dsc.GatewayIntentBits.GuildMembers,
        dsc.GatewayIntentBits.GuildVoiceStates
    ],
});