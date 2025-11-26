import * as dsc from "discord.js";

export const client = new dsc.Client({
    intents: [
        dsc.GatewayIntentBits.DirectMessages,
        dsc.GatewayIntentBits.GuildMessages,
        dsc.GatewayIntentBits.MessageContent,
        dsc.GatewayIntentBits.GuildModeration,
        dsc.GatewayIntentBits.Guilds,
        dsc.GatewayIntentBits.GuildMembers,
        dsc.GatewayIntentBits.GuildVoiceStates,
        dsc.GatewayIntentBits.GuildMessageReactions
    ],
    partials: [
        dsc.Partials.Message,
        dsc.Partials.Channel,
        dsc.Partials.Reaction
    ]
});

export function clientLogin(token: string): Promise<unknown> {
    return new Promise(async (resolve, reject) => {
        client.once('clientReady', () => {
            resolve(1);
        });

        try {
            await client.login(token);
        } catch (e) {
            reject(e);
        }
    });
}