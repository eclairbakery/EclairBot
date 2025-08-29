process.on('uncaughtException', async (e) => {
    console.error(e);
    try {
        const stringed = e.message ? e.message : (e.toString ? e.toString() : e as any as string);
        const user = await client.users.fetch('990959984005222410');
        await user.send(`siema hiouston jest problem:\n\`\`\`${stringed}\`\`\``);
    } catch {}
});

import { Command, CommandInput, Category } from './bot/command.js';
import { cfg } from './bot/cfg.js';
import { db, sqlite } from './bot/db.js';
import { PredefinedColors } from './util/color.js';

import AutoModRules from './features/actions/automod.js';

import { initExpiredWarnsDeleter } from './features/deleteExpiredWarns.js';
import { addExperiencePoints } from './bot/level.js';

import * as log from './util/log.js';

import * as dotenv from 'dotenv';
import * as dsc from 'discord.js';

dotenv.config({ quiet: true });

import { client } from './client.js';
import { EclairAI } from './bot/eclairai.js';
import { RenameableChannel, Snowflake } from './defs.js';
import actionsManager, { PredefinedActionEventTypes, PredefinedActionConstraints, PredefinedActionCallbacks } from './features/actions.js';
import { eclairAIAction } from './features/actions/eclairai.js';
import { mkAutoreplyAction } from './features/actions/autoreply.js';
import { OnForceReloadTemplates } from './events/templatesEvents.js';

import findCommand from './util/findCommand.js';
import canExecuteCmd from './util/canExecuteCmd.js';

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
import { warnClearCmd } from './cmd/mod/warn-clear.js';
import { blackjackCmd } from './cmd/economy/blackjack.js';
import { animalCmd, catCmd, dogCmd, parrotCmd } from './cmd/gif/gifs.js';
import { pfpCmd } from './cmd/general/pfp.js';
import { bannerCmd } from './cmd/general/banner.js';
import { muteCmd } from './cmd/mod/mute.js';
import { unmuteCmd } from './cmd/mod/unmute.js';
import { robCmd } from './cmd/economy/rob.js';
import { changelogCmd } from './cmd/general/changelog.js';
import { addTemplateChannel } from './features/actions/templateChannels.js';
import { randsiteCmd } from './cmd/general/randsite.js';
import { shitwarnCmd } from './cmd/mod/shitwarn.js';
import { forceReloadTemplatesCmd } from './cmd/mod/force-reload-templates.js';
import { clearCmd } from './cmd/mod/clear.js';
import { restartCmd } from './cmd/dev/restart.js';
import { wikiCmd } from './cmd/general/wiki.js';
import { fandomCmd } from './cmd/general/fandom.js';
import { evalCmd } from './cmd/dev/eval.js';

const commands: Map<Category, Command[]> = new Map([
    [
        Category.General,
        [
            detailHelpCmd, quickHelpCmd,
            commandsCmd, manCmd,
            siemaCmd, pfpCmd,
            bannerCmd, changelogCmd,
            randsiteCmd, wikiCmd,
            fandomCmd
        ]
    ],
    [
        Category.Mod,
        [
            warnCmd, kickCmd, banCmd,
            warnlistCmd, warnClearCmd,
            muteCmd, unmuteCmd, shitwarnCmd,
            forceReloadTemplatesCmd, clearCmd
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
    ],
    [
        Category.DevelopersOnly,
        [
            restartCmd, evalCmd
        ]
    ]
]);


client.once('ready', () => {
    console.log(`Logged in.`);
    initExpiredWarnsDeleter();
});

const userMessagesAntiSpamMap: Map<Snowflake, number[]> = new Map();
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
    return false; // you can remove this to activate anti-flood

    let cleaned = content
        .replace(/<@!?\d+>/g, '')
        .replace(/<@&\d+>/g, '')
        .replace(/<#\d+>/g, '')
        .trim();

    cleaned = cleaned.replace(/\b(x+d+|xd+|ej+|-+|haha+|lol+)\b/gi, '').trim();

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

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

client.on('messageCreate', async (msg): Promise<any> => {
    // block dm's, if you want to dm me, fuck out
    if (!msg.inGuild()) return;

    // antispam
    const antispamNow = Date.now();
    const antispamTimeframe = 10000;
    const antispamLimit = 5;
    if (!userMessagesAntiSpamMap.has(msg.author.id)) {
        userMessagesAntiSpamMap.set(msg.author.id, []);
    }
    const timestamps = userMessagesAntiSpamMap.get(msg.author.id);
    while (timestamps.length > 0 && antispamNow - timestamps[0] > antispamTimeframe) {
        timestamps.shift();
    }
    timestamps.push(antispamNow);
    userMessagesAntiSpamMap.set(msg.author.id, timestamps);
    if (timestamps.length > antispamLimit && client.user.id !== msg.author.id && !userRecentlyInTheList[msg.author.id]) {
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
        await msg.channel.send(`🚨 <@${msg.author.id}> za dużo floodu pozdrawiam\n-# nie usuwam wiadomości bo ten antiflood tak średnio działa teraz`);
        await filterLog(msg, 'antiflood/za dużo floodu TM');
        return;
    }

    // now goes leveling
    if (!msg.author.bot) await addExperiencePoints(msg);

    // gifs ban
    if (msg.member!.roles.cache.has(cfg.unfilteredRelated.gifBan) && msg.channelId !== cfg.unfilteredRelated.unfilteredChannel && (msg.attachments.some(att => att.name?.toLowerCase().endsWith('.gif')) || msg.content.includes('tenor.com') || msg.content.includes('.gif'))) {
        await msg.reply('masz bana na gify');
        await msg.delete();
        return;
    }

    // neocity warn
    if (cfg.unfilteredRelated.makeNeocities.includes(msg.author.id) && !msg.content.startsWith(cfg.general.prefix) && Math.random() < 0.01) {
        await msg.reply('https://youcantsitwithus.neocities.org\n-# to ma bardzo mały math random więc...');
        return;
    }

    if (!msg.content.startsWith(cfg.general.prefix)) return;
    const messageContents = msg.content.split('&&');
    if (cfg.general.blockedChannels.includes(msg.channelId) && messageContents.length > 1) {
        const reply = await msg.reply('nie możesz używać operatora wielu komend, jeżeli robisz to na kanale, gdzie używanie większości komend jest zabronione...');
        await sleep(3000);
        return await reply.delete();
    }
    if (messageContents.length > 5) {
        const reply = await msg.reply('nie możesz używać operatora wielu komend do spamowania kanałów losowymi komendami....');
        await sleep(3000);
        return await reply.delete();
    }
    let check = true;
    messageContents.forEach((messageContent) => {
        if (!messageContent.trim().startsWith(cfg.general.prefix)) {
            check = false;
        }
    });
    if (!check) {
        const reply = await msg.reply('nie możesz używać operatora wielu komend, jeżeli po tym operatorze nie występuje mój prefix');
        await sleep(3000);
        return await reply.delete();
    }
    messageContents.forEach(async (messageContent) => {
        messageContent = messageContent.trim();
        if (!messageContent.startsWith(cfg.general.prefix)) return;
        const args = messageContent.slice(cfg.general.prefix.length).trim().split(/\s+/);
        const cmdName = args.shift().toLowerCase();

        const commandObj = findCommand(cmdName, commands);
        console.log(commandObj);

        if (cfg.general.blockedChannels.includes(msg.channelId) &&
            !cfg.general.commandsExcludedFromBlockedChannels.includes(cmdName)) {

            await msg.react('❌');
            return;
        }

        if (!commandObj) {
            log.replyError(msg, 'Panie, ja nie panimaju!', `Taka komenda jak \`${cmdName.replace('\`','')}\` nie istnieje. Wpisz se ${cfg.general.prefix}help i dostarczę Ci listę komend!`);
            return;
        }

        const { command } = commandObj;

        if (!canExecuteCmd(command, msg.member!)) {
            log.replyError(msg, 'Hej, a co ty odpie*dalasz?', 'Wiesz że nie masz uprawnień? Poczekaj aż hubix się tobą zajmie...');
            return;
        }

        command.execute(msg, args, commands);
    })
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
    const welcomeChannel = await client.channels.fetch(cfg.general.welcomer.channelId);
    if (welcomeChannel == null || !welcomeChannel.isSendable()) return;

    const generalChannel = await client.channels.fetch(cfg.general.welcomer.general);
    if (generalChannel == null || !generalChannel.isSendable()) return;

    const messages = [
        `<:emoji1:1410551894023082027> Siema, ale przystojny jesteś ${member.user.username} ngl`,
        `<:emoji1:1410551894023082027> Kocham cię ${member.user.username}`,
        `<:emoji1:1410551894023082027> C-cczęsto masz tak na imie ${member.user.username}?`,
        `<:emoji1:1410551894023082027> nie chce mi się, ${member.user.username}`
    ];

    await welcomeChannel.send(messages[Math.floor(Math.random() * messages.length)]);
    await generalChannel.send(`witaj <@${member.user.id}>, będzie nam miło jak się przywitasz czy coś <:emoji_a_radosci_nie_bylo_konca:1376664467416420362>`);
});

client.on('guildMemberRemove', async (member) => {
    if (!cfg.general.welcomer.enabled) return;
    const channel = await client.channels.fetch(cfg.general.welcomer.channelId);
    if (!channel.isSendable()) return;
    await channel.send(`<:emoji2:1410551857935290368> do widzenia ${member.user.username} 🥀 już zmieniłem zdanie nie jesteś przystojny`);
});

client.on('guildMemberUpdate', async (oldMember, newMember) => {
    const rolesToWatch = [cfg.unfilteredRelated.gifBan];
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
    actionsManager.addAction({
        activationEventType: PredefinedActionEventTypes.OnMessageCreate,
        constraints: [
            (msg: dsc.Message) => {
                if (msg.author.bot) return false;
                const channel = cfg.general.forFun.media.find((mc) => mc.channel == msg.channelId);
                if (channel == null || channel == undefined) return false;
                return true;
            }
        ],
        callbacks: [
            async (msg: dsc.Message) => {
                const channelConfig = cfg.general.forFun.media.find((mc) => mc.channel == msg.channelId)!;
                let check = false;
                if (msg.attachments.size > 0) {
                    for (const attachment of msg.attachments.values()) {
                        if (attachment.contentType?.startsWith("image/")) {
                            check = true;
                        } else if (attachment.contentType?.startsWith("video/")) {
                            check = true;
                        }
                    }
                }
                if (/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}/.test(msg.content)) {
                    check = true;
                }
                if (check) {
                    if (channelConfig.shallCreateThread) {
                        await msg.startThread({
                            name: 'Odpowiedzi!',
                            reason: 'Tutaj się pisze odpowiedzi czy coś.'
                        });
                    }
                    for (const reaction of channelConfig.addReactions) {
                        await msg.react(reaction);
                    }
                } else if (channelConfig.deleteMessageIfNotMedia) {
                    const reply = await msg.reply('to nie do tego kanał <:joe_wow:1308174905489100820>');
                    await sleep(2000);
                    await msg.delete();
                    await reply.delete();
                    return;
                }
            }
        ]
    });
    actionsManager.addAction({
        activationEventType: PredefinedActionEventTypes.OnMessageCreateOrEdit,
        constraints: [
            (msg: dsc.Message) => {
                if (msg.author.bot) return false;
                if (msg.channelId !== cfg.general.forFun.countingChannel) return false;
                return true;
            }
        ],
        callbacks: [
            async (msg: dsc.Message) => {
                const number = parseInt(msg.content.trim());
                if (isNaN(number)) {
                    const reply = await msg.reply(`to nie do tego kanał <:joe_wow:1308174905489100820>`);
                    await sleep(1000);
                    await msg.delete();
                    await reply.delete();
                    return;
                }

                const messages = await msg.channel.messages.fetch({ limit: 2 });
                const lastMsg = messages.filter(m => m.id !== msg.id).first();

                let lastNumber = 0;
                if (lastMsg) {
                    const parsed = parseInt(lastMsg.content.trim());
                    if (!isNaN(parsed)) {
                        lastNumber = parsed;
                    }
                }

                if (number === lastNumber + 1) {
                    return;
                } else {
                    const reply = await msg.reply(`pomyliłeś się <:joe_smutny:1317904814025474088>`);
                    await sleep(1000);
                    await msg.delete();
                    await reply.delete();
                    return;
                }
            }
        ]
    });
    actionsManager.addAction({
        activationEventType: PredefinedActionEventTypes.OnMessageCreateOrEdit,
        constraints: [
            (msg: dsc.Message) => {
                if (msg.author.bot) return false;
                if (msg.channelId !== cfg.general.forFun.lastLetterChannel) return false; 
                return true;
            }
        ],
        callbacks: [
            async (msg: dsc.Message) => {
                const word = msg.content.trim();
                if (word.length < 1) {
                    const reply = await msg.reply(`to nie do tego kanał <:joe_wow:1308174905489100820>`);
                    await sleep(1000);
                    await msg.delete();
                    await reply.delete();
                    return;
                }

                const messages = await msg.channel.messages.fetch({ limit: 2 });
                const lastMsg = messages.filter(m => m.id !== msg.id).first();

                if (lastMsg) {
                    const lastWord = lastMsg.content.trim();
                    if (lastWord.length > 0) {
                        const expectedFirst = lastWord[lastWord.length - 1].toLowerCase();
                        const actualFirst = word[0].toLowerCase();

                        if (expectedFirst !== actualFirst) {
                            const reply = await msg.reply(`pomyliłeś się <:joe_smutny:1317904814025474088>`);
                            await sleep(1000);
                            await msg.delete();
                            await reply.delete();
                            return;
                        }
                    }
                }
                if (msg.content.endsWith('ą')) {
                    const reply = await msg.reply(`no ej no przeczytałeś kanał opis? <:joe_zatrzymanie_akcji_serca:1308174897758994443>`);
                    await sleep(1000);
                    await msg.delete();
                    await reply.delete();
                    return;
                }
            }
        ]
    });

    actionsManager.registerEvents(client);

    const populationTemplateChannel = await getChannel('1235591547437973557') as dsc.GuildChannel;
    addTemplateChannel({
        channel: populationTemplateChannel,
        updateOnEvents: [
            PredefinedActionEventTypes.OnUserJoin,
            PredefinedActionEventTypes.OnUserQuit,
            OnForceReloadTemplates,
        ],
        format: (ctx) => `👥・Populacja: ${populationTemplateChannel.guild.memberCount} osób`,
    });

    const templateChannelTarget = await getChannel('1276862197099794514') as dsc.GuildChannel;
    addTemplateChannel({
        channel: templateChannelTarget,
        updateOnEvents: [
            PredefinedActionEventTypes.OnUserJoin,
            PredefinedActionEventTypes.OnUserQuit,
            OnForceReloadTemplates,
        ],
        format: (ctx) => `🎯・Cel: ${getNextGoal(templateChannelTarget.guild.memberCount)} osób`,
    });

    const bansTemplateChannel = await getChannel('1235591871020011540') as dsc.GuildChannel;
    addTemplateChannel({
        channel: bansTemplateChannel,
        updateOnEvents: [
            PredefinedActionEventTypes.OnUserBan,
            PredefinedActionEventTypes.OnUserUnban,
            OnForceReloadTemplates,
        ],
        format: async (ctx) => {
            const guild = bansTemplateChannel.guild;
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
