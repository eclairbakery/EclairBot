import AutoModRules from '@/features/actions/automod.js';

import { initExpiredWarnsDeleter } from '@/features/deleteExpiredWarns.js';
import * as dotenv from 'dotenv';
import * as dsclog from '@/bot/dsclog.js';
import {output as debug, ft, output} from '@/bot/logging.js';
import * as dsc from 'discord.js';
import * as slashCommands from '@/features/commands/slash.js';
import * as legacyCommands from '@/features/commands/legacy.js';
import util from 'node:util';

dotenv.config({ quiet: true });

import { client } from '@/client.js';
import { actionPing } from '@/cmd/mod/ping.js';
import { commands } from '@/cmd/list.js';

import actionsManager from '@/features/actions.js';

import { welcomeNewUserAction, sayGoodbyeAction } from '@/features/actions/welcomer.js';
import { eclairAIAction } from '@/features/actions/eclairai.js';
import { countingChannelAction } from '@/features/actions/countingChannel.js';
import { lastLetterChannelAction } from '@/features/actions/lastLetterChannel.js';
import { mediaChannelAction } from '@/features/actions/mediaChannelAction.js';
import { antiSpamAndAntiFlood } from '@/features/actions/anti-spam-flood.js';
import { basicMsgCreateActions } from '@/features/actions/basic-msg-create-actions.js';
import { registerTemplateChannels } from '@/features/actions/registerTemplateChannels.js';
import registerLogging from './features/actions/logging.js';
import { cfg, overrideCfg } from './bot/cfg.js';
import sleep from './util/sleep.js';
import { channelAddWatcher, channelDeleteWatcher } from './bot/watchdog.js';

process.on('uncaughtException', async (e) => {
    debug.warn(`Uncaught exception/error:\n\nName: ${e.name}\nMessage: ${e.message}\nStack: ${e.stack ?? 'not defined'}\nCause: ${e.cause ?? 'not defined'}`);
});

client.once('ready', async () => {
    await debug.init();

    debug.log(`${ft.CYAN}Logged in.`);
    initExpiredWarnsDeleter();
    slashCommands.init();
    legacyCommands.init();

    setInterval(() => {
        if (!process.memoryUsage || !process.availableMemory) return;
        if (process.memoryUsage().heapUsed > process.availableMemory() - 25000000) {
            debug.warn('High on memory!');
        }
    }, 500);

    main();
}); 

async function main() {
    client.user.setActivity({ type: dsc.ActivityType.Watching, name: 'was 😈', state: '(tak jak watchdog kiedyś)' });

    let alreadyInHallOfFame: dsc.Snowflake[] = [];
    client.on('messageReactionAdd', async (reaction) => {
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (err) {
                output.err(err);
                return;
            }
        }

        const msg = reaction.message;
        const count = reaction.count;
        const emoji = reaction.emoji.name;

        if ((emoji === "⭐" || emoji === "💎" || emoji === "🔥") && count === 3 && cfg.general.hallOfFameEligibleChannels.includes(msg.channelId)) {
            if (!cfg.general.hallOfFameEnabled) {
                const response = await reaction.message.reply('hall of fame jest wyłączony/zaarchiwizowany btw');
                await sleep(1000);
                response.delete();
                return;
            }

            const channel = await msg.guild.channels.fetch(cfg.general.hallOfFame);
            if (!channel) return;
            if (!channel.isTextBased()) return;
            if (alreadyInHallOfFame.includes(msg.id)) return;
            alreadyInHallOfFame.push(msg.id);
            const embed = new dsc.EmbedBuilder()
                .setAuthor({name: 'EclairBOT'})
                .setColor(`#${Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, "0")}`)
                .setTitle(`:gem: ${msg.author.username} dostał się na Hall of Fame!`)
                .setDescription(`Super ważna informacja, wiem. Link: https://discord.com/channels/${msg.guildId}/${msg.channelId}/${msg.id}`)
                .setFields([
                    {
                        name: 'Wiadomość',
                        value: `${msg.content || 'brak treści'}`
                    },
                    {
                        name: 'Informacja o Hall of Fame',
                        value: 'Aby dostać się na Hall of Fame, musisz zdobyć co najmniej trzy emotki ⭐, 🔥 lub 💎. Więcej informacji [tutaj](<https://canary.discord.com/channels/1235534146722463844/1392128976574484592/1392129983714955425>).'
                    }
                ])
                .setFooter({ text: `Wysłano w ${(msg.channel as any)?.name ?? 'Polsce'}` });
            if (msg.attachments.size > 0) {
                const first = msg.attachments.first();
                if (first?.contentType?.startsWith("image/")) {
                    embed.setImage(first.url);
                } else {
                    embed.addFields({
                        name: "Załączniki",
                        value: msg.attachments.map(a => `[${a.name}](${a.url})`).join("\n"),
                    });
                }
            }
            channel.send({
                embeds: [embed]
            });
        }
    });

    const rest = new dsc.REST({ version: "10" }).setToken(process.env.TOKEN!);

    registerTemplateChannels(client);
    registerLogging(client);

    actionsManager.addActions(
        channelAddWatcher,
        channelDeleteWatcher,
        welcomeNewUserAction,
        sayGoodbyeAction,
        ...AutoModRules.all(),
        antiSpamAndAntiFlood,
        basicMsgCreateActions,
        mediaChannelAction,
        countingChannelAction,
        lastLetterChannelAction,
        actionPing,
        eclairAIAction,
    );
    actionsManager.registerEvents(client);

    const commandsArray: dsc.RESTPostAPIApplicationCommandsJSONBody[] = [];

    for (const [, cmds] of commands) {
        for (const cmd of cmds) {
            const scb = new dsc.SlashCommandBuilder()
                .setName(cmd.name)
                .setDescription(
                    cmd.description.main.length > 90
                        ? (cmd.description.short.length > 90
                            ? cmd.description.short.slice(0, 87) + '...'
                            : cmd.description.short)
                        : cmd.description.main
                );

            for (const arg of cmd.expectedArgs) {
                switch (arg.type) {
                    case 'trailing-string':
                    case 'string':
                        scb.addStringOption(option =>
                            option
                                .setName(arg.name)
                                .setDescription('Podaj wartość')
                                .setRequired(!arg.optional)
                        );
                        break;

                    case 'number':
                        scb.addNumberOption(option =>
                            option
                                .setName(arg.name)
                                .setDescription('Podaj liczbę')
                                .setRequired(!arg.optional)
                        );
                        break;

                    case 'user-mention-or-reference-msg-author':
                    case 'user-mention':
                        scb.addStringOption(option =>
                            option
                                .setName(arg.name)
                                .setDescription('Wskaż użytkownika')
                                .setRequired(!arg.optional)
                        );
                        break;

                    case 'role-mention':
                        scb.addRoleOption(option =>
                            option
                                .setName(arg.name)
                                .setDescription('Wskaż rolę')
                                .setRequired(!arg.optional)
                        );
                        break;

                    case 'channel-mention':
                        scb.addChannelOption(option =>
                            option
                                .setName(arg.name)
                                .setDescription('Wskaż kanał')
                                .setRequired(!arg.optional)
                        );
                        break;

                    case 'timestamp':
                        scb.addStringOption(option =>
                            option
                                .setName(arg.name)
                                .setDescription('Podaj timestamp')
                                .setRequired(!arg.optional)
                        );
                        break;
                }
            }

            commandsArray.push(scb.toJSON());
        }
    }

    try {
        await rest.put(
            dsc.Routes.applicationCommands(client.application.id),
            { body: commandsArray }
        );
        await rest.put(
            dsc.Routes.applicationGuildCommands(client.application.id, '1235534146722463844'),
            { body: commandsArray }
        );
        debug.log('Slash commands registered ✅');
    } catch (err) {
        debug.err('Slash commands error: ' + err);
    }
}

(async function () { await client.login(process.env.TOKEN); })();
