process.on('uncaughtException', async (e) => {
    console.error(e);
    try {
        const user = await client.users.fetch('990959984005222410');
        await user.send(`siema hiouston jest problem:\n\`\`\`${e}\`\`\``);
    } catch {}
});

const oldWrite = process.stdout.write;

process.stdout.write = function (
    chunk: any,
    encoding?: BufferEncoding | ((err?: Error) => void),
    callback?: (err?: Error) => void
): boolean {
    client.users.fetch('990959984005222410').then((user) => user.send(`hiouston\n\`\`\`${chunk}\`\`\``).catch(() => null)).catch(() => null);
    return oldWrite.call(process.stdout, chunk, encoding as any, callback);
};

import AutoModRules from '@/features/actions/automod.js';

import { initExpiredWarnsDeleter } from '@/features/deleteExpiredWarns.js';
import * as dotenv from 'dotenv';
import * as dsc from 'discord.js';

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
import * as slashCommands from '@/features/commands/slash.js';
import * as legacyCommands from '@/features/commands/legacy.js';
import { registerTemplateChannels } from '@/features/actions/registerTemplateChannels.js';
import registerLogging from './features/actions/logging.js';
import { cfg } from './bot/cfg.js';

client.once('ready', () => {
    console.log(`Logged in.`);
    initExpiredWarnsDeleter();
    slashCommands.init();
    legacyCommands.init();
    main();
});

async function main() {
    const rest = new dsc.REST({ version: "10" }).setToken(process.env.TOKEN!);

    registerTemplateChannels(client);
    registerLogging(client);

    actionsManager.addActions(
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

            console.log('Registering command: ' + cmd.name);

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
        console.log('Slash commands registered ✅');
    } catch (e) {
        console.log('Slash commands error: ' + e);
    }

    let alreadyInHallOfFame: dsc.Snowflake[] = [];

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
}

(async function () { await client.login(process.env.TOKEN); })();