import * as dotenv from 'dotenv';
dotenv.config({quiet: true});

import { GatewayIntentBits, Client } from 'discord.js';

const client = new Client({ intents: [GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildModeration] });

client.once('ready', () => {
    console.log(`Logged in.`);
});

client.login(process.env.TOKEN);