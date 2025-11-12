// preparation & basic imports
import { client } from '@/client.js';
import { output as debug, ft } from '@/bot/logging.js';
import * as dotenv from 'dotenv';
process.on('uncaughtException', async (e) => {
    debug.err(`Uncaught exception/error:\n\nName: ${e.name}\nMessage: ${e.message}\nStack: ${e.stack ?? 'not defined'}\nCause: ${e.cause ?? 'not defined'}`);
    if (e.message.includes('An invalid token was provided.')) {
        debug.err('Automatic shutdown. Token is invalid.');
        process.exit(2);
    }
});
dotenv.config({ quiet: true });

// required libs
import * as dsc from 'discord.js';

// configuration
import { cfg } from './bot/cfg.js';

// actions
import AutoModRules from '@/features/actions/mod/automod.js';
import { initExpiredWarnsDeleter } from '@/features/deleteExpiredWarns.js';
import { welcomeNewUserAction, sayGoodbyeAction } from '@/features/actions/others/welcomer.js';
import { eclairAIAction } from '@/features/actions/others/eclairai.js';
import { countingChannelAction } from '@/features/actions/4fun/countingChannel.js';
import { lastLetterChannelAction } from '@/features/actions/4fun/lastLetterChannel.js';
import { mediaChannelAction } from '@/features/actions/4fun/mediaChannelAction.js';
import { antiSpamAndAntiFlood } from '@/features/actions/mod/anti-spam-flood.js';
import { basicMsgCreateActions } from '@/features/actions/others/basicMsgCreateActions.js';
import { registerTemplateChannels } from '@/features/actions/channels/registerTemplateChannels.js';
import { channelAddWatcher, channelDeleteWatcher, onMuteGivenWatcher, onWarnGivenWatcher, watchRoleChanges } from './bot/watchdog.js';
import { actionPing } from '@/cmd/mod/ping.js';
import { hallOfFameAction } from './features/actions/4fun/hallOfFame.js';

// events
import { registerChannelCreateDscEvents } from './events/client/channelCreate.js';
import { registerChannelDeleteDscEvents } from './events/client/channelDelete.js';
import { registerMsgEditDscEvents } from './events/client/messageUpdate.js';
import { registerMsgDeleteDscEvents } from './events/client/messageDelete.js';

// commands
import * as slashCommands from '@/features/commands/slash.js';
import * as legacyCommands from '@/features/commands/legacy.js';
import { commands } from '@/cmd/list.js';

// misc
import actionsManager from '@/features/actions/index.js';
import { getChannel } from './features/actions/channels/templateChannels.js';
import { warnGivenLogAction } from './features/actions/mod/warn-given.js';

// --------------- INIT ---------------
client.once('clientReady', async () => {
    await debug.init();
    debug.log(`${ft.CYAN}Logged in.`);

    if (!process.env.ANON_SAYS_WEBHOOK) {
        debug.warn('You should set the ANON_SAYS_WEBHOOK enviorment variable.\nOtherwise, the anonsays command will not work.\nThis webhook shall be in the general channel.');
    }
    if (!process.env.TENOR_API) {
        debug.warn('You should set the TENOR_API enviorment variable to a Tenor API key.\nOtherwise, the Tenor API-based commands will not work.');
    }

    main();
}); 

// --------------- SETUP ---------------

function setUpActions() {
    actionsManager.addActions(
        // watchdog security features
        channelAddWatcher,
        channelDeleteWatcher,
        onWarnGivenWatcher,
        onMuteGivenWatcher,
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
        // hall of fame
        hallOfFameAction,
        // additional features
        actionPing,
        warnGivenLogAction
    );
    registerTemplateChannels(client);
    slashCommands.init();
    legacyCommands.init();
    actionsManager.registerEvents(client);

    // will be moved
    client.on('roleCreate', (newRole: dsc.Role) => {
        watchRoleChanges(newRole, newRole.permissions.toArray());
    });

    client.on('roleUpdate', (oldRole: dsc.Role, newRole: dsc.Role) => {
        watchRoleChanges(newRole, newRole.permissions.toArray().filter(p => !oldRole.permissions.toArray().includes(p)));
    });
}

function setUpEvents() {
    registerChannelCreateDscEvents(client);
    registerChannelDeleteDscEvents(client);
    registerMsgEditDscEvents(client);
    registerMsgDeleteDscEvents(client);
}

// --------------- MAIN ---------------
async function main() {
    client.user!.setActivity({ type: dsc.ActivityType.Watching, name: 'was 😈', state: '(tak jak watchdog kiedyś)' });
    initExpiredWarnsDeleter();
    setUpActions();
    setUpEvents();

    setInterval(() => {
        if (!process.memoryUsage || !process.availableMemory) return;
        if (process.memoryUsage().heapUsed > process.availableMemory() - 25000000) {
            debug.warn('High on memory!');
        }
    }, 500);

    if (cfg.general.databaseBackups.enabled) {
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
                    content: `${cfg.general.databaseBackups.msg} (${new Date().toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw' })})`,
                    files: [{ attachment: dbPath, name: backupName }]
                });
            } catch (e) {
                debug.err('while sending db at bot.db: ' + e);
            }
        }, cfg.general.databaseBackups.interval);
    }
}

(async function () { await client.login(process.env.TOKEN); })();
