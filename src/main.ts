// BEGIN DISABLE  THE ENTIRE THING BY ONE ERROR
process.on('uncaughtException', (e) => {
    console.error(e);
});
process.on('SIGSEGV', () => {
    // there is no other fucking way to make
    // this happen rather than my broken cpu/motherboard
    console.log('komputer gorcia detected');
})
// END DISABLE  THE ENTIRE THING BY ONE ERROR

import { Command } from './bot/command';
import { cfg } from './bot/cfg';
import { db, sqlite } from './bot/db';
import { PredefinedColors } from './util/color';

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
import { workCmd } from './cmd/economy/work';
import { slutCmd } from './cmd/economy/slut';
import { crimeCmd } from './cmd/economy/crime';
import { addExperiencePoints } from './bot/level';
import { xpCmd } from './cmd/leveling/xp';
import { lvlCmd } from './cmd/leveling/lvl';
import { toplvlCmd } from './cmd/leveling/toplvl';

const commands: Command[] = [
    // general
    helpCmd, manCmd, siemaCmd,
    // moderation
    warnCmd, kickCmd, banCmd,
    warnlistCmd,
    // economy
    workCmd, slutCmd, crimeCmd,
    // leveling
    lvlCmd, xpCmd, toplvlCmd
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

    // now goes leveling
    if (!msg.author.bot) addExperiencePoints(msg);

    // let's do something awesome
    if (!msg.author.bot && (msg.content.includes('cat') || msg.content.includes('kot'))) {
        msg.reply(await getGIF('cat'));
    }
    if (!msg.author.bot && (msg.content.includes('dog') || msg.content.includes('pies'))) {
        msg.reply(await getGIF('dog'));
    }

    // commands logic [ugly code warn]
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

client.on('guildMemberAdd', async (member) => {
    if (!cfg.general.welcomer.enabled) return;
    const channel = await client.channels.fetch(cfg.general.welcomer.channelId);
    if (!channel.isSendable()) return;
    const msg = await channel.send({
        content: `<@${member.id}>`,
        embeds: [
            new dsc.EmbedBuilder()
                .setTitle(`Właśnie Eklerka upiekł ${member.user.username}!`)
                .setColor(PredefinedColors.YellowGreen)
                .setDescription(`Witaj na naszym serwerze, drogi <@${member.id}>. Jak już zdołałeś się domyślić, no to Eklerka... piecze pieczywo. Robi też odcinki na swojej żonie (komputerze). Właśnie Cię upiekł, i zostałeś jednym z pieczyw... tych na sprzedaż. Sprzedaż nastąpi wtedy kiedy wyjdziesz z serwera. No to tyle z lore\'u na razie, resztę zobaczysz jak chwilę popiszesz...`)
                .setThumbnail(member.displayAvatarURL({ size: 128 }))
        ]
    });
    msg.edit('‎');
});

client.on('guildMemberRemove', async (member) => {
    if (!cfg.general.welcomer.enabled) return;
    const channel = await client.channels.fetch(cfg.general.welcomer.channelId);
    if (!channel.isSendable()) return;
    const msg = await channel.send({
        content: `<@${member.id}>`,
        embeds: [
            new dsc.EmbedBuilder()
                .setTitle(`Eklerka sprzedał bagietkę "${member.user.username}"!`)
                .setColor(PredefinedColors.DarkButNotBlack)
                .setDescription(`Naszemu naczelnemu piekarzowi się powodzi. Właśnie sprzedał kolejną bagietkę. Ludzie bardzo chętnie kupują od niego również chleb. Ale to nie ważne. Dla innych pieczyw jest to wielka i bolesna strata użytkownika...`)
                .setThumbnail(member.displayAvatarURL({ size: 128 }))
        ]
    });
    msg.edit('‎');
});

client.login(process.env.TOKEN);
