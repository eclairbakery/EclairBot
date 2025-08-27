process.on('uncaughtException', (e) => {
    console.error(e);
});

import { Command, CommandInput, Category } from './bot/command.js';
import { cfg } from './bot/cfg.js';
import { db, sqlite } from './bot/db.js';
import { PredefinedColors } from './util/color.js';

import AutoModRules from './features/actions/automod.js';

import { initExpiredWarnsDeleter } from './features/deleteExpiredWarns.js';
import { addExperiencePoints } from './bot/level.js';

import * as log from './util/log.js';
import * as cfgManager from './bot/cfgManager.js';

import * as dotenv from 'dotenv';
import * as dsc from 'discord.js';

dotenv.config({ quiet: true });

import { client } from './client.js';
import { EclairAI } from './bot/eclairai.js';
import { RenameableChannel, Snowflake } from './defs.js';
import actionsManager, { PredefinedActionEventTypes, PredefinedActionConstraints, PredefinedActionCallbacks } from './features/actions.js';
import { eclairAIAction } from './features/actions/eclairai.js';
import { mkAutoreplyAction } from './features/actions/autoreply.js';
import findCommand from './util/findCommand.js';

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
import { addTemplateChannel } from './features/actions/templateChannels.js';
import canExecuteCmd from './util/canExecuteCmd.js';
import { randsiteCmd } from './cmd/general/randsite.js';
import { shitwarnCmd } from './cmd/mod/shitwarn.js';

const commands: Map<Category, Command[]> = new Map([
    [
        Category.General,
        [
            detailHelpCmd, quickHelpCmd,
            commandsCmd, manCmd,
            siemaCmd, pfpCmd,
            bannerCmd, changelogCmd,
            randsiteCmd
        ]
    ],
    [
        Category.Mod,
        [
            warnCmd, kickCmd, banCmd,
            warnlistCmd, warnClearCmd,
            muteCmd, unmuteCmd, shitwarnCmd
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

const userMessagesAntiSpamMapIGuessIDontHaveIdeaOnHowToNameTHis = new Map();
let userRecentlyInTheList: Record<Snowflake, boolean> = {};

async function filterLog(msg: dsc.Message, system: string) {
    const channel = await msg.client.channels.fetch(cfg.logs.channel);
    if (!channel.isSendable()) return;
    await channel.send({
        content: '<@&1410323193763463188>',
        embeds: [
            new dsc.EmbedBuilder()
                .setAuthor({
                    name: 'EclairBOT'
                })
                .setColor(0xff0000)
                .setTitle('Wiadomość została usunięta przez filtry AutoMod')
                .setDescription(`Tu masz autora co nie: <@${msg.author.id}>\nA tu masz link co nie: https://discord.com/channels/${msg.guildId}/${msg.channelId}/${msg.id}`)
                .setFields([
                    {
                        name: 'Wiadomość',
                        value: msg.content
                    },
                    {
                        name: 'System moderacyjny',
                        value: system
                    }
                ])
        ]
    });
}

function isFlood(content: string) {
    let cleaned = content
        .replace(/<@!?\d+>/g, '')
        .replace(/<@&\d+>/g, '')  
        .replace(/<#\d+>/g, '') 
        .trim();

    cleaned = cleaned.replace(/\b(x+d+|xd+|haha+|lol+)\b/gi, '').trim();

    if (!cleaned) return false;

    const normalized = cleaned.replace(/\s+/g, '');
    const shortRegex = /(.{1,3})\1{4,}/;
    if (shortRegex.test(normalized)) return true;

    const parts = cleaned.toLowerCase().split(/\s+/);
    for (let size = 2; size <= Math.min(10, Math.floor(parts.length / 2)); size++) {
        const chunk = parts.slice(0, size).join(' ');
        let repeats = 0;
        for (let i = 0; i < parts.length; i += size) {
            if (parts.slice(i, i + size).join(' ') === chunk) {
                repeats++;
            } else {
                break;
            }
        }
        if (repeats >= 3) return true;
    }

    return false;
}

client.on('messageCreate', async (msg) => {
    // block dm's, if you want to dm me, fuck out
    if (!msg.inGuild()) return;

    // antispam
    const antispam_now = Date.now();
    const antispam_timeframe = 10000;
    const antispam_limit = 5; 
    if (!userMessagesAntiSpamMapIGuessIDontHaveIdeaOnHowToNameTHis.has(msg.author.id)) {
        userMessagesAntiSpamMapIGuessIDontHaveIdeaOnHowToNameTHis.set(msg.author.id, []);
    }
    const timestamps = userMessagesAntiSpamMapIGuessIDontHaveIdeaOnHowToNameTHis.get(msg.author.id);
    while (timestamps.length > 0 && antispam_now - timestamps[0] > antispam_timeframe) {
        timestamps.shift();
    }
    timestamps.push(antispam_now);
    userMessagesAntiSpamMapIGuessIDontHaveIdeaOnHowToNameTHis.set(msg.author.id, timestamps);
    if (timestamps.length > antispam_limit && client.user.id !== msg.author.id && !userRecentlyInTheList[msg.author.id]) {
        userRecentlyInTheList[msg.author.id] = true;
        await msg.channel.send(`🚨 <@${msg.author.id}> co ty odsigmiasz`);
        try {
            await msg.member.timeout(5 * 60 * 1000, 'co ty odsigmiasz? czemu spamisz?');
        } catch {}
        setTimeout(() => {
            userRecentlyInTheList[msg.author.id] = false; // prevents from bot's spamming
        }, 5000);
        await msg.delete();
        try {
            const messages = await msg.channel.messages.fetch({ limit: 25 });
            const sameContent = messages.filter(m => 
                m.author.id === msg.author.id && m.content === msg.content
            );
            const toDelete = sameContent.first(10);
            for (const m of toDelete) {
                try { await m.delete(); } catch {}
            }
        } catch {}
        await filterLog(msg, 'antispam/co ty odsigmiasz TM');
        return;
    }

    // antiflood
    if (client.user.id !== msg.author.id && isFlood(msg.content)) {
        await msg.channel.send(`🚨 <@${msg.author.id}> za dużo floodu pozdrawiam`);
        await msg.delete();
        await filterLog(msg, 'antiflood/za dużo floodu TM');
        return;
    }

    // now goes leveling
    if (!msg.author.bot) addExperiencePoints(msg);

    // gifs ban
    if (msg.member!.roles.cache.has(cfg.unfilteredRelated.gifBan) && msg.channelId !== cfg.unfilteredRelated.unfilteredChannel && (msg.attachments.some(att => att.name?.toLowerCase().endsWith('.gif')) || msg.content.includes('tenor.com') || msg.content.includes('.gif'))) {
        await msg.reply('masz bana na gify');
        return await msg.delete();
    }

    // neocity warn
    if (msg.member!.roles.cache.has(cfg.unfilteredRelated.makeNeocities)) {
        return await msg.reply('https://youcantsitwithus.neocities.org');
    }

    if (!msg.content.startsWith(cfg.general.prefix)) return;

    const args = msg.content.slice(cfg.general.prefix.length).trim().split(/\s+/);
    const cmdName = args.shift().toLowerCase();

    const commandObj = findCommand(cmdName, commands);

    if (!commandObj) {
        log.replyError(msg, 'Panie, ja nie panimaju!', `Wpisz se ${cfg.general.prefix}help i dostarczę Ci listę komend!`);
        return;
    }

    const  { command } = commandObj;

    if (cfg.general.blockedChannels.includes(msg.channelId) &&
        !cfg.general.commandsExcludedFromBlockedChannels.includes(command.name)) {

        msg.react('❌');
        return;
    }

    if (!cfg.general.commandsExcludedFromBlockedChannels.includes(command.name) && Math.random() < 0.3) {
        msg.reply('nie chce mi sie');
        return;
    }

    if (!canExecuteCmd(command, msg.member!)) {
        log.replyError(msg, 'Hej, a co ty odpie*dalasz?', 'Wiesz że nie masz uprawnień? Poczekaj aż hubix się tobą zajmie...');
        return;
    }

    return command.execute(msg, args, commands);
});

client.on('messageUpdate', async (oldMsg, msg) => {
    const channel = await client.channels.fetch(cfg.logs.channel);
    if (!channel.isSendable()) return;
    channel.send({
        embeds: [
            new dsc.EmbedBuilder()
                .setAuthor({
                    name: 'EclairBOT'
                })
                .setColor(PredefinedColors.Blue)
                .setTitle('Edycja wiadomości')
                .setDescription(`Tu masz autora co nie: <@${msg.author.id}>\nA tu masz link co nie: https://discord.com/channels/${msg.guildId}/${msg.channelId}/${msg.id}`)
                .setFields([
                    {
                        name: 'Stara wiadomość',
                        value: oldMsg.content
                    },
                    {
                        name: 'Nowa wiadomość',
                        value: msg.content
                    }
                ])
        ]
    });
});

client.on('messageDelete', async (msg) => {
    const channel = await client.channels.fetch(cfg.logs.channel);
    if (!channel.isSendable()) return;
    channel.send({
        embeds: [
            new dsc.EmbedBuilder()
                .setAuthor({
                    name: 'EclairBOT'
                })
                .setColor(PredefinedColors.Red)
                .setTitle('W internecie nic nie ginie!')
                .setDescription(`Jakiś jełop zwany <@${msg.author.id}> usunął tą wiadomość: https://discord.com/channels/${msg.guildId}/${msg.channelId}/${msg.id}`)
                .setFields([
                    {
                        name: 'Treść',
                        value: msg.content
                    }
                ])
        ]
    });
});

client.on('channelCreate', async (chan) => {
    const channel = await client.channels.fetch(cfg.logs.channel);
    if (!channel.isSendable()) return;
    channel.send({
        embeds: [
            new dsc.EmbedBuilder()
                .setAuthor({
                    name: 'EclairBOT'
                })
                .setColor(PredefinedColors.Yellow)
                .setTitle('Nowy kanał na piekarnii!')
                .setDescription(`Powstał kanał <#${chan.id}> na naszym serwerze!`)
        ]
    });
});

client.on('channelDelete', async (chan) => {
    const channel = await client.channels.fetch(cfg.logs.channel);
    if (!channel.isSendable()) return;
    channel.send({
        embeds: [
            new dsc.EmbedBuilder()
                .setAuthor({
                    name: 'EclairBOT'
                })
                .setColor(PredefinedColors.Red)
                .setTitle('Usunięto kawał historii piekarnii!')
                .setDescription(`Kanał <#${chan.id}> został usunięty! Niestety nie mam zielonego pojęcia co to za kanał.`)
        ]
    });
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
    await secchannel.send(`witaj <@${member.user.id}>, będzie nam miło jak się przywitasz czy coś <:emoji_a_radosci_nie_bylo_konca:1376664467416420362>`);
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
    const rolesToWatch = [cfg.unfilteredRelated.gifBan, cfg.unfilteredRelated.makeNeocities];
    const allowedRoleIds = cfg.unfilteredRelated.eligibleToRemoveGifBan;

    const removedRoles = rolesToWatch.filter(roleId =>
        oldMember.roles.cache.has(roleId) && !newMember.roles.cache.has(roleId)
    );

    if (removedRoles.length > 0) {
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
                    change.new.some(r => removedRoles.includes(r.id))
                )
            ) {
                const executor = logEntry.executor;
                const memberExecutor = await newMember.guild.members.fetch(executor.id);

                const hasAllowedRole = allowedRoleIds.some(id => memberExecutor.roles.cache.has(id));

                if (!hasAllowedRole) {
                    for (const roleId of removedRoles) {
                        await newMember.roles.add(roleId, "Nieautoryzowane odebranie roli");
                    }
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
            let match: RegExpExecArray | null = null;

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

let alreadyInHallOfFame: Snowflake[] = [];

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

    if ((emoji === "⭐" || emoji === "💎" || emoji === "🔥") && count === 3 && cfg.general.hallOfFameEligibleChannels.includes(msg.channelId)) {
        const channel = await msg.guild.channels.fetch(cfg.general.hallOfFame);
        if (!channel) return;
        if (!channel.isTextBased()) return;
        if (alreadyInHallOfFame.includes(msg.id)) return;
        alreadyInHallOfFame.push(msg.id);
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
                            value: 'Aby dostać się na Hall of Fame, musisz zdobyć co najmniej trzy emotki ⭐, 🔥 lub 💎. Więcej informacji [tutaj](<https://canary.discord.com/channels/1235534146722463844/1392128976574484592/1392129983714955425>).'
                        }
                    ])
            ]
        });
    }
});

async function getChannel(id: Snowflake): Promise<dsc.Channel> {
    let channel = client.channels.cache.get(id);
    if (channel == null) {
        channel = await client.channels.fetch(id);
    }

    return channel;
}

function getNextGoal(memberCount: number): number {
    const base = Math.floor(memberCount / 50) * 50;
    let goal = base + 50;
    if (goal <= memberCount) {
        goal += 50;
    }
    return goal;
}

async function main() {
    await client.login(process.env.TOKEN);

    const rest = new dsc.REST({ version: "10" }).setToken(process.env.TOKEN!);

    actionsManager.addAction(eclairAIAction);
    actionsManager.addActions(...AutoModRules.all());
    actionsManager.registerEvents(client);

    addTemplateChannel({
        channel: await getChannel('1235591547437973557') as RenameableChannel,
        updateOnEvents: [
            PredefinedActionEventTypes.OnUserJoin,
            PredefinedActionEventTypes.OnUserQuit,
            PredefinedActionEventTypes.OnThreadDelete, /* easy to trigger event but it's not super common so i'll leave it as "force reload" */
        ],
        format: async (ctx) => {
            console.log('Updating population channel');
            return `👥・Populacja: ${(await getChannel('1235591547437973557') as dsc.GuildChannel).guild.memberCount} osób`;
        },
    });

    addTemplateChannel({
        channel: await getChannel('1276862197099794514') as RenameableChannel,
        updateOnEvents: [
            PredefinedActionEventTypes.OnUserJoin,
            PredefinedActionEventTypes.OnUserQuit,
            PredefinedActionEventTypes.OnThreadDelete,
        ],
        format: async (ctx) => {
            const guild = (await getChannel('1276862197099794514') as dsc.GuildChannel).guild;
            const goal = getNextGoal(guild.memberCount);
            return `🎯・Cel: ${goal} osób`;
        },
    });

    addTemplateChannel({
        channel: await getChannel('1235591871020011540') as RenameableChannel,
        updateOnEvents: [
            PredefinedActionEventTypes.OnUserJoin,
            PredefinedActionEventTypes.OnUserQuit,
            PredefinedActionEventTypes.OnThreadDelete,
        ],
        format: async (ctx) => {
            const guild = (await getChannel('1235591871020011540') as dsc.GuildChannel).guild;
            const bans = await guild.bans.fetch();
            return `🚫・Bany: ${bans.size}`;
        },
    });

    let commandsArray: dsc.RESTPostAPIApplicationCommandsJSONBody[] = [];
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
