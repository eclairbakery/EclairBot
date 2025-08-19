process.on('uncaughtException', (e) => {
    console.error(e);
});

import { Command, CommandInput, Category } from './bot/command.js';
import { cfg } from './bot/cfg.js';
import { db, sqlite } from './bot/db.js';
import { PredefinedColors } from './util/color.js';

import { initExpiredWarnsDeleter } from './features/deleteExpiredWarns.js';
import { addExperiencePoints } from './bot/level.js';

import * as log from './util/log.js';
import * as cfgManager from './bot/cfgManager.js';
import * as automod from './bot/automod.js';

import * as dotenv from 'dotenv';
import * as dsc from 'discord.js';

dotenv.config({ quiet: true });

import { client } from './client.js';
import { EclairAI } from './bot/eclairai.js';

import { ActionEventType, actionsManager, PredefinedActionConstraints, PredefinedActionCallbacks } from './features/actions.js';
import { eclairAIYesNoAction } from './features/actions/ecliaraiYesNo.js';
import { mkAutoreplyAction } from './features/actions/autoreply.js';

import { warnCmd } from './cmd/mod/warn.js';
import { kickCmd } from './cmd/mod/kick.js';
import { banCmd } from './cmd/mod/ban.js';
import { detailHelpCmd } from './cmd/general/detailHelp.js';
import { quickHelpCmd } from './cmd/general/help.js';
import { commandsCmd } from './cmd/general/commands.js';
import { manCmd } from './cmd/general/man.js';
import { warnlistCmd } from './cmd/mod/warnlist.js';
import { siemaCmd } from './cmd/general/siema.js';
import { workCmd } from './cmd/economy/work.js';
import { slutCmd } from './cmd/economy/slut.js';
import { crimeCmd } from './cmd/economy/crime.js';
import { xpCmd } from './cmd/leveling/xp.js';
import { lvlCmd } from './cmd/leveling/lvl.js';
import { toplvlCmd } from './cmd/leveling/toplvl.js';
import { topecoCmd } from './cmd/economy/topeco.js';
import { balCmd } from './cmd/economy/bal.js';
import { warnClearCmd } from './cmd/mod/warnClear.js';
import { blackjackCmd } from './cmd/economy/blackjack.js';
import { animalCmd, catCmd, dogCmd, parrotCmd } from './cmd/gif/gifs.js';
import { pfpCmd } from './cmd/general/pfp.js';
import { bannerCmd } from './cmd/general/banner.js';
import { muteCmd } from './cmd/mod/mute.js';
import { unmuteCmd } from './cmd/mod/unmute.js';
import { robCmd } from './cmd/economy/rob.js';
import { changelogCmd } from './cmd/general/changelog.js';
import findCommand from './util/findCommand.js';

const commands: Map<Category, Command[]> = new Map([
    [
        Category.General,
        [
            detailHelpCmd, quickHelpCmd,
            commandsCmd, manCmd,
            siemaCmd, pfpCmd,
            bannerCmd, changelogCmd
        ]
    ],
    [
        Category.Mod,
        [
            warnCmd, kickCmd, banCmd,
            warnlistCmd, warnClearCmd,
            muteCmd, unmuteCmd
        ]
    ],
    [
        Category.Economy,
        [
            workCmd, slutCmd, crimeCmd,
            topecoCmd, balCmd, blackjackCmd,
            robCmd
        ]
    ],
    [
        Category.Leveling,
        [
            lvlCmd, xpCmd, toplvlCmd,
        ]
    ],
    [
        Category.Gifs,
        [
            catCmd, dogCmd, parrotCmd,
            animalCmd
        ]
    ]
]);


client.once('ready', () => {
    console.log(`Logged in.`);
    initExpiredWarnsDeleter();
});

client.on('messageCreate', async (msg) => {
    // block dm's, if you want to dm me, fuck out
    if (!msg.inGuild()) return;

    // a little reverse automod
    if (!msg.author.bot) if (await automod.automod(msg, client)) return;

    // now goes leveling
    if (!msg.author.bot) addExperiencePoints(msg);

    // gifs ban
    if (msg.member!.roles.cache.has(cfg.unfilteredRelated.gifBan) && msg.channelId !== cfg.unfilteredRelated.unfilteredChannel && (msg.attachments.some(att => att.name?.toLowerCase().endsWith('.gif')) || msg.content.includes('tenor.com') || msg.content.includes('.gif'))) {
        await msg.reply('masz bana na gify');
        return await msg.delete();
    }

    // eclairAI
    // if (msg.content.startsWith(`<@${msg.client.user.id}> czy`) || msg.content.startsWith(`<@!${msg.client.user.id}> czy`) || (msg.content.startsWith(`czy`) && msg.channelId == cfg.ai.channel && !msg.author.bot)) {
    //     const responses = ['tak', 'nie', 'idk', 'kto wie', 'raczej nie', 'niezbyt', 'raczej tak', 'definitynie NIE', 'definitywnie TAK', 'TAK!', 'NIE!', 'zaprzeczam', 'potwierdzam', 'nie chce mi sie tego osądzać'];
    //     const response: string = (msg.content.toLowerCase().includes('windows jest lepszy od linux') || msg.content.toLowerCase().includes('windows jest lepszy niz linux') || msg.content.toLowerCase().includes('windows jest lepszy niż linux')) ? 'NIE' : ((msg.content.toLowerCase().includes('linux jest lepszy od windows') || msg.content.toLowerCase().includes('linux jest lepszy niz windows') || msg.content.toLowerCase().includes('linux jest lepszy niż windows')) ? 'TAK' : (responses[Math.floor(Math.random() * responses.length)])); // propaganda piekarnii eklerki
    //     return msg.reply(response);
    // } else if (msg.channelId == cfg.ai.channel && !msg.author.bot) {
    //     if (msg.content.startsWith(cfg.general.prefix)) {
    //         return msg.reply('-# Komendy nie są obsługiwane na kanale EclairAI fan edition.');
    //     }
    //     const ai = new EclairAI(msg);
    //     return ai.reply();
    // }

    if (!msg.content.startsWith(cfg.general.prefix)) return;

    const args = msg.content.slice(cfg.general.prefix.length).trim().split(/\s+/);
    const cmdName = args.shift().toLowerCase();

    const { command } = findCommand(cmdName, commands);

    if (!command) {
        log.replyError(msg, 'Panie, ja nie panimaju!', `Wpisz se ${cfg.general.prefix}help i dostarczę Ci listę komend!`);
        return;
    }

    if (cfg.general.blockedChannels.includes(msg.channelId) &&
        !cfg.general.commandsExcludedFromBlockedChannels.includes(command.name)) {

        msg.react('❌');
        return;
    }

    if (command.allowedRoles != null && !msg.member.roles.cache.some(role => command.allowedRoles.includes(role.id))) {
        log.replyError(msg, 'Hej, a co ty odpie*dalasz?', 'Wiesz że nie masz uprawnień? Poczekaj aż hubix się tobą zajmie...');
        return;
    }

    return command.execute(msg, args, commands);
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

client.on('guildMemberUpdate', async (oldMember, newMember) => {
    const roleIdToWatch = cfg.unfilteredRelated.gifBan;
    const allowedRoleIds = cfg.unfilteredRelated.eligibleToRemoveGifBan;

    const hadRole = oldMember.roles.cache.has(roleIdToWatch);
    const hasRole = newMember.roles.cache.has(roleIdToWatch);

    if (hadRole && !hasRole) {
        try {
            const fetchedLogs = await newMember.guild.fetchAuditLogs({
                limit: 1,
                type: dsc.AuditLogEvent.MemberRoleUpdate
            });

            const logEntry = fetchedLogs.entries.first();

            if (
                logEntry &&
                logEntry.target.id === newMember.id &&
                logEntry.changes.some(change =>
                    change.key === "$remove" &&
                    change.new.some(r => r.id === roleIdToWatch)
                )
            ) {
                const executor = logEntry.executor;
                const memberExecutor = await newMember.guild.members.fetch(executor.id);

                const hasAllowedRole = allowedRoleIds.some(id => memberExecutor.roles.cache.has(id));

                if (!hasAllowedRole) {
                    await newMember.roles.add(roleIdToWatch, "Nieautoryzowane odebranie roli");
                }
            }
        } catch (err) {
            console.error(err);
        }
    }
});

client.on('interactionCreate', async (int) => {
    function parseMentionsFromStrings(args: string[], guild: dsc.Guild = int.guild) {
        const users = new dsc.Collection<string, dsc.User>();
        const roles = new dsc.Collection<string, dsc.Role>();
        const members = new dsc.Collection<string, dsc.GuildMember>();
        const channels = new dsc.Collection<string, dsc.GuildChannel>();

        const userRegex = /^<@!?(\d+)>$/;
        const roleRegex = /^<@&(\d+)>$/;
        const channelRegex = /^<#(\d+)>$/;

        for (const arg of args) {
            let match;

            if ((match = userRegex.exec(arg))) {
                const id = match[1];
                const user = guild.client.users.cache.get(id);
                if (user) users.set(id, user);

                const member = guild.members.cache.get(id);
                if (member) members.set(id, member);

            } else if ((match = roleRegex.exec(arg))) {
                const id = match[1];
                const role = guild.roles.cache.get(id);
                if (role) roles.set(id, role);

            } else if ((match = channelRegex.exec(arg))) {
                const id = match[1];
                const channel = guild.channels.cache.get(id);
                if (channel && channel.type !== dsc.ChannelType.PublicThread && channel.type !== dsc.ChannelType.PrivateThread) {
                    channels.set(id, channel as dsc.GuildChannel);
                }
            }
        }

        return { users, roles, members, channels };
    }

    if (!int.isChatInputCommand()) return;
    await int.deferReply();

    const { commandName, options, member, channelId } = int;

    let cmdObject: Command;
    for (const [_, cmds] of commands) {
        cmdObject = cmds.find((val) => val.name === commandName);
        if (cmdObject) {
            break;
        }
    }
    if (!cmdObject) {
        await int.reply({ content: 'Nie znam takiej komendy!', flags: ["Ephemeral"] });
        return;
    }

    if (cfg.general.blockedChannels.includes(channelId) &&
        !cfg.general.commandsExcludedFromBlockedChannels.includes(commandName)) {
        await int.reply({ content: 'Ten kanał nie pozwala na używanie tej komendy!', flags: ["Ephemeral"] });
        return;
    }

    if (cmdObject.allowedRoles &&
        !((member.roles as dsc.GuildMemberRoleManager).cache.some((role: any) => cmdObject.allowedRoles.includes(role.id)))) {
        await int.reply({ content: 'Nie masz uprawnień do tej komendy!', flags: ["Ephemeral"] });
        return;
    }

    try {
        const args: any[] = [];
        cmdObject.expectedArgs?.forEach(opt => {
            const val = options.getString(opt.name);
            args.push(val);
        });

        // ugly but works
        const interact: CommandInput = (int as any as CommandInput);
        interact.author = int.user;
        interact.mentions = (parseMentionsFromStrings(cmdObject.expectedArgs?.map(opt => options.getString(opt.name)) || []) as any as dsc.MessageMentions);
        interact.reply = (async (options: any) => {
            try {
                if (int.deferred || int.replied) {
                    await int.editReply(options);
                } else {
                    await int.reply(options);
                }
            } catch (err) {
                console.error(err);
            }
        }) as any;

        await cmdObject.execute(interact, args, commands);
    } catch (err) {
        console.error(err);
        await int.reply({ content: 'Coś poszło nie tak podczas wykonywania komendy.', flags: ["Ephemeral"] });
    }
});

client.on('messageReactionAdd', async (reaction) => {
    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (err) {
            console.error(err);
            return;
        }
    }

    const msg = reaction.message;
    const count = reaction.count;
    const emoji = reaction.emoji.name;

    if ((emoji === "⭐" || emoji === "💎") && count === 3 && cfg.general.hallOfFameEligibleChannels.includes(msg.channelId)) {
        const channel = await msg.guild.channels.fetch(cfg.general.hallOfFame);
        if (!channel) return;
        if (!channel.isTextBased()) return;
        channel.send({
            embeds: [
                new dsc.EmbedBuilder()
                    .setAuthor({name: 'EclairBOT'})
                    .setColor(`#${Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, "0")}`)
                    .setTitle(`:gem: ${msg.author.username} dostał się na Hall of Fame!`)
                    .setDescription(`Super ważna informacja, wiem. Link: https://discord.com/channels/${msg.guildId}/${msg.channelId}/${msg.id}`)
                    .setFields([
                        {
                            name: 'Wiadomość',
                            value: `\`\`\`${msg.content}\`\`\``
                        },
                        {
                            name: 'Informacja o Hall of Fame',
                            value: 'Aby dostać się na Hall of Fame, musisz zdobyć co najmniej trzy emotki ⭐ lub 💎. Więcej informacji [tutaj](<https://canary.discord.com/channels/1235534146722463844/1392128976574484592/1392129983714955425>).'
                        }
                    ])
            ]
        });
    }
});

async function main() {
    await client.login(process.env.TOKEN);

    const rest = new dsc.REST({ version: "10" }).setToken(process.env.TOKEN!);

    if (false) { // dear maqix, enable this, but disable the automod
        actionsManager.addAction(eclairAIYesNoAction);
        actionsManager.addAction(mkAutoreplyAction({
            activationOptions: [
                { type: 'starts-with', keyword: 'git' }
            ],
            reply: 'hub'
        }));
        actionsManager.addAction(mkAutoreplyAction({
            activationOptions: [
                { type: 'is-equal-to', keyword: 'kiedy odcinek' },
                { type: 'is-equal-to', keyword: 'kiedy odcinek?' },
                { type: 'is-equal-to', keyword: 'kiedy film' },
                { type: 'is-equal-to', keyword: 'kiedy film?' },
            ],
            reply: 'nigdy - powiedział StartIT, ale ponieważ startit jest jebanym gównem no to spinguj eklerke by odpowiedział'
        }));
        actionsManager.addAction(mkAutoreplyAction({
            activationOptions: [
                { type: 'contains', keyword: '@everyone' },
            ],
            reply: 'Pan piekarz, czy tam Eklerka będzie zły...',
            additionalCallbacks: [PredefinedActionCallbacks.deleteMsg]
        }));
        actionsManager.registerEvents(client);
    }

    let commandsArray: dsc.RESTPostAPIApplicationCommandsJSONBody[] = [];
    // commands.forEach((cmd) => {
    //     const scb = new dsc.SlashCommandBuilder()
    //         .setName(cmd.name)
    //         .setDescription(cmd.longDesc.length > 97 - cmd.category.name.length ? `[${cmd.category}] Użyj 'man' po opis, opis zbyt długi dla discord.js.` : `[${cmd.category}] ${cmd.longDesc}`);
    //     cmd.expectedArgs.forEach(arg => {
    //         scb.addStringOption((option) => option
    //             .setName(arg.name)
    //             .setDescription('Domyśl się, bo discord.js nie pozwala dużo znaków.')
    //             .setRequired(false)
    //         );
    //     });
    //     commandsArray.push(scb.toJSON());
    // });
    for (const [category, cmds] of commands) {
        for (const cmd of cmds) {
            const scb = new dsc.SlashCommandBuilder()
                .setName(cmd.name)
                .setDescription('Domyśl się, bo discord.js nie pozwala dużo znaków.');
            for (const arg of cmd.expectedArgs) {
                scb.addStringOption((option) => option
                    .setName(arg.name)
                    .setDescription('Domyśl się, bo discord.js nie pozwala dużo znaków.')
                    .setRequired(false)
                );
            }
            commandsArray.push(scb.toJSON());
        }
    }
    try {
        await rest.put(
            dsc.Routes.applicationCommands(client.application.id),
            { body: commandsArray }
        );
    } catch (error) {
        console.error(error);
    }
};

main();