import { Command } from './bot/command';
import { cfg } from './bot/cfg';
import { db, sqlite } from './bot/db';

import * as log from './util/log';
import * as cfgManager from './bot/cfgManager';
import * as automod from './bot/automod';

import * as dotenv from 'dotenv';
import * as dsc from 'discord.js';

dotenv.config({ quiet: true });

import { warnCmd } from './cmd/mod/warn';
import { kickCmd } from './cmd/mod/kick';
import { banCmd } from './cmd/mod/ban';
import { helpCmd } from './cmd/random/help';
import { manCmd } from './cmd/random/man';
import { warnlistCmd } from './cmd/mod/warnlist';
import { siemaCmd } from './cmd/random/siema';

const commands: Command[] = [
    // general
    helpCmd, manCmd, siemaCmd,
    // moderation
    warnCmd, kickCmd, banCmd,
    warnlistCmd
]

const client = new dsc.Client({
    intents: [
        dsc.GatewayIntentBits.DirectMessages,
        dsc.GatewayIntentBits.GuildMessages,
        dsc.GatewayIntentBits.MessageContent,
        dsc.GatewayIntentBits.GuildModeration,
        dsc.GatewayIntentBits.Guilds,
        dsc.GatewayIntentBits.GuildMembers,
    ],
});

client.once('ready', () => {
    console.log(`Logged in.`);
});

async function getGIF(searchTerm: string): Promise<string> {
    const apiKey = process.env.TENOR_API;
    const url = `https://tenor.googleapis.com/v2/search?q=${searchTerm}&key=${apiKey}&limit=1&random=true&media_filter=minimal`;

    try {
        const response = await fetch(url);
        const json = (await response.json()) as any;

        if (json.results && json.results.length > 0) {
            return json.results[0].media_formats.gif.url;
        } else {
            return 'Nie znaleziono!';
        }
    } catch (error) {
        console.error('Błąd podczas pobierania GIFa:', error);
        return 'Wystąpił błąd!';
    }
}

client.on('messageCreate', async (msg) => {
    // block dm's, if you want to dm me, fuck out
    if (!msg.inGuild()) return;

    // a little reverse automod
    if (await automod.automod(msg, client)) return;

    // let's do something awesome
    if (!msg.author.bot && (msg.content.includes('cat') || msg.content.includes('kot'))) {
        msg.reply(await getGIF('cat'));
    }
    if (!msg.author.bot && (msg.content.includes('dog') || msg.content.includes('pies'))) {
        msg.reply(await getGIF('dog'));
    }

    // let's do commands
    if (!msg.content.startsWith(cfg.general.prefix)) return;
    const args = msg.content.slice(cfg.general.prefix.length).trim().split(/\s+/);
    const command = args.shift();
    const cmdObject = commands.find((val) => val.name == command || val.aliases.includes(command));
    if (!cmdObject) {
        log.replyError(msg, 'Panie, ja nie panimaju!', `Wpisz se \`${cfg.general.prefix}help\` i dostarczę Ci listę komend!`);
        return;
    } else if (cmdObject.allowedRoles != null && !msg.member.roles.cache.some((role) => cmdObject.allowedRoles.includes(role.id))) {
        log.replyError(msg, 'Hej, a co ty odpie*dalasz?', `Wiesz że nie masz uprawnień? Poczekaj aż hubix się tobą zajmie...`);
        return;
    } else {
        return cmdObject.execute(msg, args, commands);
    }
});

client.login(process.env.TOKEN);
