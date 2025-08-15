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

import { Command } from './bot/command.js';
import { cfg } from './bot/cfg.js';
import { db, sqlite } from './bot/db.js';
import { PredefinedColors } from './util/color.js';

import * as log from './util/log.js';
import * as cfgManager from './bot/cfgManager.js';
import * as automod from './bot/automod.js';

import * as dotenv from 'dotenv';
import * as dsc from 'discord.js';

dotenv.config({ quiet: true });

import { client } from './client.js';

import { warnCmd } from './cmd/mod/warn.js';
import { kickCmd } from './cmd/mod/kick.js';
import { banCmd } from './cmd/mod/ban.js';
import { helpCmd } from './cmd/random/help.js';
import { manCmd } from './cmd/random/man.js';
import { warnlistCmd } from './cmd/mod/warnlist.js';
import { siemaCmd } from './cmd/random/siema.js';
import { workCmd } from './cmd/economy/work.js';
import { slutCmd } from './cmd/economy/slut.js';
import { crimeCmd } from './cmd/economy/crime.js';
import { addExperiencePoints } from './bot/level.js';
import { xpCmd } from './cmd/leveling/xp.js';
import { lvlCmd } from './cmd/leveling/lvl.js';
import { toplvlCmd } from './cmd/leveling/toplvl.js';
import { topecoCmd } from './cmd/economy/topeco.js';
import { balCmd } from './cmd/economy/bal.js';
import { warnClearCmd } from './cmd/mod/warnClear.js';
import { blackjackCmd } from './cmd/economy/blackjack.js';

const commands: Command[] = [
    // general
    helpCmd, manCmd, siemaCmd,
    // moderation
    warnCmd, kickCmd, banCmd,
    warnlistCmd, warnClearCmd,
    // economy
    workCmd, slutCmd, crimeCmd,
    topecoCmd, balCmd, blackjackCmd,
    // leveling
    lvlCmd, xpCmd, toplvlCmd
];

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
    if (!msg.author.bot) if (await automod.automod(msg, client)) return;

    // now goes leveling
    if (!msg.author.bot) addExperiencePoints(msg);

    // let's do something awesome
    // UPDATE: only a command does trigger this behaviour
    if (!msg.author.bot && (msg.content.startsWith(cfg.general.prefix + 'cat') || msg.content.startsWith(cfg.general.prefix + 'kot'))) {
        return msg.reply(await getGIF('cat'));
    }
    if (!msg.author.bot && (msg.content.startsWith(cfg.general.prefix + 'pies') || msg.content.startsWith(cfg.general.prefix + 'dog'))) {
        return msg.reply(await getGIF('dog'));
    }

    // commands logic [ugly code warn]
    if (!msg.content.startsWith(cfg.general.prefix)) return;
    const args = msg.content.slice(cfg.general.prefix.length).trim().split(/\s+/);
    const command = args.shift().toLowerCase();
    const cmdObject = commands.find((val) => val.name == command || val.aliases.includes(command));
    if (cfg.general.blockedChannels.includes(msg.channelId) && !cfg.general.commandsExcludedFromBlockedChannels.includes(command)) {
        return msg.react('❌');
    } else if (!cmdObject) {
        log.replyError(msg, 'Panie, ja nie panimaju!', `Wpisz se \`${cfg.general.prefix}help\` i dostarczę Ci listę komend!`);
        return;
    } else if (cmdObject.allowedRoles != null && !msg.member.roles.cache.some((role) => cmdObject.allowedRoles.includes(role.id))) {
        log.replyError(msg, 'Hej, a co ty odpie*dalasz?', `Wiesz że nie masz uprawnień? Poczekaj aż hubix się tobą zajmie...`);
        return;
    } else if (!cfg.radio.enabled && cmdObject.category == 'muzyka') {
        log.replyError(msg, 'Radio piekarnii zostało wyłączone.', `Prawdopodobnie gorciu pierdoli się teraz z hostingiem, by je uruchomić.`);
        return;
    } else {
        return cmdObject.execute(msg, args, commands);
    }
});

client.on('guildMemberAdd', async (member) => {
    if (!cfg.general.welcomer.enabled) return;
    const channel = await client.channels.fetch(cfg.general.welcomer.channelId);
    if (!channel.isSendable()) return;
    const secchannel = await client.channels.fetch(cfg.general.welcomer.general);
    if (!secchannel.isSendable()) return;
    await channel.send({
        embeds: [
            new dsc.EmbedBuilder()
                .setTitle(`Właśnie Eklerka upiekł ${member.user.username}!`)
                .setColor(PredefinedColors.Purple)
                .setDescription(`Siema <@${member.id}>. Jak ci mija życie, bo mi git (chyba)? Jak to czytasz to popisz na generalu, nie będę cię za rączkę prowadził...`)
                .setThumbnail(member.displayAvatarURL({ size: 128 }))
        ]
    });
    await secchannel.send(`witaj <@${member.user.id}>, będzie nam miło jak się przywitasz czy coś <:emoji_a_radosci_nie_bylo_konca:1376664467416420362>\n-# jak już zdołałeś się domyślić, no to eklerka... piecze pieczywo; robi też odcinki na swojej żonie (komputerze). właśnie Cię upiekł, i zostałeś jednym z pieczyw... tych na sprzedaż. sprzedaż nastąpi wtedy kiedy wyjdziesz z serwera. no to tyle z lore'u na razie, resztę zobaczysz jak chwilę popiszesz...`);
});

client.on('guildMemberRemove', async (member) => {
    if (!cfg.general.welcomer.enabled) return;
    const channel = await client.channels.fetch(cfg.general.welcomer.channelId);
    if (!channel.isSendable()) return;
    await channel.send({
        embeds: [
            new dsc.EmbedBuilder()
                .setTitle(`Eklerka sprzedał bagietkę "${member.user.username}"!`)
                .setColor(PredefinedColors.DarkButNotBlack)
                .setDescription(`Naszemu naczelnemu piekarzowi się powodzi. Właśnie sprzedał kolejną bagietkę. Ludzie bardzo chętnie kupują od niego również chleb. Ale to nie ważne. Dla innych pieczyw jest to wielka i bolesna strata użytkownika...`)
                .setThumbnail(member.displayAvatarURL({ size: 128 }))
        ]
    });
});

client.on('interactionCreate', async (int) => {
    if (!int.isChatInputCommand()) return;
    int.reply({flags: ["Ephemeral"], content: "przygotowywuje codebase pod slash commands\njakby to powiedział amerykanin stay tuned\n~ gorciu"});
});

client.login(process.env.TOKEN);

const rest = new dsc.REST({ version: "10" }).setToken(process.env.TOKEN!);

(async () => {
    let commandsArray: dsc.RESTPostAPIApplicationCommandsJSONBody[] = [];
    commands.forEach((cmd) => {
        const scb = new dsc.SlashCommandBuilder()
            .setName(cmd.name)
            .setDescription(`[${cmd.category}] ${cmd.desc.substring(0, 80) === cmd.desc ? cmd.desc : (cmd.desc.substring(0, 80) + '...')}`);
        cmd.expectedArgs.forEach(arg => {
            scb.addStringOption((option) => option
                .setName(arg.name)
                .setDescription(arg.desc)
                .setRequired(false)
            );
        });
        commandsArray.push(scb.toJSON());
    });
    try {
        await rest.put(
            dsc.Routes.applicationCommands(client.application.id),
            { body: commandsArray }
        );
    } catch (error) {
        console.error(error);
    }
})();