import * as dsc from 'discord.js';

export const client = new dsc.Client({
    intents: [
        dsc.GatewayIntentBits.DirectMessages,
        dsc.GatewayIntentBits.GuildMessages,
        dsc.GatewayIntentBits.MessageContent,
        dsc.GatewayIntentBits.GuildModeration,
        dsc.GatewayIntentBits.GuildPresences,
        dsc.GatewayIntentBits.Guilds,
        dsc.GatewayIntentBits.GuildMembers,
        dsc.GatewayIntentBits.GuildVoiceStates,
        dsc.GatewayIntentBits.GuildMessageReactions,
        dsc.GatewayIntentBits.GuildMessagePolls
    ],
    partials: [
        dsc.Partials.Message,
        dsc.Partials.Channel,
        dsc.Partials.Reaction,
        dsc.Partials.GuildMember
    ]
});
