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

import { client } from './client.js';
import actionsManager from '@/features/actions.js';
import { eclairAIAction } from '@/features/actions/eclairai.js';
import { countingChannelAction } from '@/features/actions/countingChannel.js';
import { lastLetterChannelAction } from '@/features/actions/lastLetterChannel.js';
import { mediaChannelAction } from '@/features/actions/mediaChannelAction.js';
import { welcomeNewUserAction, sayGoodbyeAction } from '@/features/actions/welcomer.js';
import { actionPing } from './cmd/mod/ping.js';
import { antiSpamAndAntiFlood } from '@/features/actions/anti-spam-flood.js';
import { basicMsgCreateActions } from '@/features/actions/basic-msg-create-actions.js';
import { commands } from './cmd/list.js';
import * as slashCommands from '@/features/commands/slash.js';
import * as legacyCommands from '@/features/commands/legacy.js';

client.once('ready', () => {
    console.log(`Logged in.`);
    initExpiredWarnsDeleter();
    slashCommands.init();
    legacyCommands.init();
});

async function main() {
    await client.login(process.env.TOKEN);

    const rest = new dsc.REST({ version: "10" }).setToken(process.env.TOKEN!);

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
        eclairAIAction
    );
    actionsManager.registerEvents(client);

    const commandsArray: dsc.RESTPostAPIApplicationCommandsJSONBody[] = [];

    for (const [, cmds] of commands) {
        for (const cmd of cmds) {
            const scb = new dsc.SlashCommandBuilder()
                .setName(cmd.name)
                .setDescription(cmd.description.main.length > 90 ? (cmd.description.short.length > 90 ? 'Domyśl się, bo discord.js nie pozwala dużo znaków.' : cmd.description.short) : cmd.description.main);

            for (const arg of cmd.expectedArgs) {
                switch (arg.type) {
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
        console.log('Slash commands registered ✅');
    } catch {}
}

main();