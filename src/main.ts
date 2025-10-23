// preparation & basic imports
import { client } from '@/client.js';
import { output as debug, ft } from '@/bot/logging.js';
import * as dotenv from 'dotenv';
process.on('uncaughtException', async (e) => {
    debug.warn(`Uncaught exception/error:\n\nName: ${e.name}\nMessage: ${e.message}\nStack: ${e.stack ?? 'not defined'}\nCause: ${e.cause ?? 'not defined'}`);
});
dotenv.config({ quiet: true });

// required libs
import * as dsc from 'discord.js';

// configuration
import { cfg } from './bot/cfg.js';

// actions
import AutoModRules from '@/features/actions/automod.js';
import { initExpiredWarnsDeleter } from '@/features/deleteExpiredWarns.js';
import { welcomeNewUserAction, sayGoodbyeAction } from '@/features/actions/welcomer.js';
import { eclairAIAction } from '@/features/actions/eclairai.js';
import { countingChannelAction } from '@/features/actions/countingChannel.js';
import { lastLetterChannelAction } from '@/features/actions/lastLetterChannel.js';
import { mediaChannelAction } from '@/features/actions/mediaChannelAction.js';
import { antiSpamAndAntiFlood } from '@/features/actions/anti-spam-flood.js';
import { basicMsgCreateActions } from '@/features/actions/basic-msg-create-actions.js';
import { registerTemplateChannels } from '@/features/actions/registerTemplateChannels.js';
import registerLogging from './features/actions/logging.js';
import { channelAddWatcher, channelDeleteWatcher } from './bot/watchdog.js';
import { actionPing } from '@/cmd/mod/ping.js';
import { hallOfFameAction } from './features/actions/hallOfFame.js';

// commands
import * as slashCommands from '@/features/commands/slash.js';
import * as legacyCommands from '@/features/commands/legacy.js';
import { commands } from '@/cmd/list.js';

// misc
import actionsManager from '@/features/actions.js';
import { getChannel } from './features/actions/templateChannels.js';

// --------------- INIT ---------------
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

// --------------- SETUP ---------------
async function setUpCommands() {
    const commandsArray: dsc.RESTPostAPIApplicationCommandsJSONBody[] = [];
    const rest = new dsc.REST({ version: "10" }).setToken(process.env.TOKEN!);

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
            dsc.Routes.applicationCommands(client.application!.id),
            { body: commandsArray }
        );
        await rest.put(
            dsc.Routes.applicationGuildCommands(client.application!.id, '1235534146722463844'),
            { body: commandsArray }
        );
        debug.log('Slash commands registered ✅');
    } catch (err) {
        debug.err('Slash commands error: ' + err);
    }
}

function setUpActions() {
    actionsManager.addActions(
        // hall of fame
        hallOfFameAction,
        // watchdog security features
        channelAddWatcher,
        channelDeleteWatcher,
        // lobby & users watchdog
        welcomeNewUserAction,
        sayGoodbyeAction,
        // automod & anti-spam with anti-flood
        ...AutoModRules.all(),
        antiSpamAndAntiFlood,
        // msg-specific actions
        basicMsgCreateActions,
        mediaChannelAction,
        countingChannelAction,
        lastLetterChannelAction,
        eclairAIAction,
        // additional features
        actionPing,
    );
    registerTemplateChannels(client);
    registerLogging(client);
    actionsManager.registerEvents(client);
}

// --------------- MAIN ---------------
async function main() {
    client.user!.setActivity({ type: dsc.ActivityType.Watching, name: 'was 😈', state: '(tak jak watchdog kiedyś)' });
    setUpCommands();
    setUpActions();

    setInterval(async () => {
        let dbBackUpsChannel: dsc.GuildTextBasedChannel;
        try {
            dbBackUpsChannel = await getChannel(cfg.channels.eclairbot.dbBackups, client) as dsc.GuildTextBasedChannel;
        } catch {
            debug.err('could not find the channel to send db backups');
            return;
        }
        if (!dbBackUpsChannel.isSendable()) {
            debug.err('the channel with db backups is not sendable');
            return;
        }
        try {
            const dbPath = './bot.db';
            const backupName = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.db`;

            await dbBackUpsChannel.send({
                content: `🗄️ automatyczny backup masz tutaj (${new Date().toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw' })})`,
                files: [{ attachment: dbPath, name: backupName }]
            });
        } catch (e) {
            debug.err('while sending db at bot.db: ' + e);
        }
    }, 2 * 60 * 60 * 1000);
}

(async function () { await client.login(process.env.TOKEN); })();
