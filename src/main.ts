console.log('Welcome to EclairBOT!');

// preparation & basic imports
import { client } from '@/client.js';
import { output, ft } from '@/bot/logging.js';
import * as dotenv from 'dotenv';
process.on('uncaughtException', async (e) => {
    output.err(`Uncaught exception/error:\n\nName: ${e.name}\nMessage: ${e.message}\nStack: ${e.stack ?? 'not defined'}\nCause: ${e.cause ?? 'not defined'}`);
    if (e.message.includes('An invalid token was provided.')) {
        output.err('Automatic shutdown. Token is invalid.');
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
import { countingChannelAction } from '@/features/actions/4fun/countingChannel.js';
import { lastLetterChannelAction } from '@/features/actions/4fun/lastLetterChannel.js';
import { mediaChannelAction } from '@/features/actions/4fun/mediaChannelAction.js';
import { antiSpamAndAntiFlood } from '@/features/actions/mod/anti-spam-flood.js';
import { basicMsgCreateActions } from '@/features/actions/others/basicMsgCreateActions.js';
import { registerTemplateChannels } from '@/features/actions/channels/registerTemplateChannels.js';
import { channelAddWatcher, channelDeleteWatcher, onMuteGivenWatcher, onWarnGivenWatcher, setUpWatchdog } from './bot/watchdog.js';
import { actionPing } from '@/features/actions/4fun/pingDeathChat.js';
import { hallOfFameAction } from './features/actions/4fun/hallOfFame.js';
import { onReceivedEmailAction } from './features/actions/others/on-new-email.js';

// events
import { registerChannelCreateDscEvents } from './events/client/channelCreate.js';
import { registerChannelDeleteDscEvents } from './events/client/channelDelete.js';
import { registerMsgEditDscEvents } from './events/client/messageUpdate.js';
import { registerMsgDeleteDscEvents } from './events/client/messageDelete.js';

// commands
import * as slashCommands from '@/features/commands/slash.js';
import * as legacyCommands from '@/features/commands/legacy.js';

import * as email from '@/bot/apis/email/mail.js';
import * as cache from '@/bot/apis/cache/cache.js';

import * as log from '@/util/log.js';

// misc
import actionsManager from '@/features/actions/index.js';
import { db } from '@/bot/apis/db/bot-db.js';

import { initEmailActionsIntegration } from '@/bot/apis/email/actions.js';
import { getChannel } from '@/features/actions/channels/templateChannels.js';
import { warnGivenLogAction } from '@/features/actions/mod/warn-given.js';
import { setUpStatusGenerator } from '@/util/generateStatusQuote.js';

// --------------- INIT ---------------
client.once('clientReady', async () => {
    await output.init();
    output.log(`${ft.CYAN}Logged in.`);
    await db.init();
    output.log(`Database initialized.`);
    await email.init();
    output.log(`Email initialized.`);
    await cache.init();
    output.log(`Cache initialized.`);

    await initEmailActionsIntegration();

    if (!process.env.TENOR_API) {
        output.warn('You should set the TENOR_API enviorment variable to a Tenor API key.\nOtherwise, the Tenor API-based commands will not work.');
    }

    if (!process.env.EB_EMAIL_USER || !process.env.EB_EMAIL_PASS) {
        output.warn('You should set EB_EMAIL_USER and EB_EMAIL_PASS enviorment variables to a GMail login and temporary password\nOtherwise, the e-mail based commands will not work');
    }

    await main();
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
        // hall of fame
        hallOfFameAction,
        // additional features
        actionPing,
        warnGivenLogAction,
        onReceivedEmailAction,
        
    );
    registerTemplateChannels(client);
    slashCommands.init();
    legacyCommands.init();
    actionsManager.registerEvents(client);
}

function setUpEvents() {
    registerChannelCreateDscEvents(client);
    registerChannelDeleteDscEvents(client);
    registerMsgEditDscEvents(client);
    registerMsgDeleteDscEvents(client);
    setUpWatchdog();
}

// --------------- MAIN ---------------
async function main() {
    setUpStatusGenerator();
    initExpiredWarnsDeleter();
    setUpActions();
    setUpEvents();

    let memoryIssuesTimes = 0;

    setInterval(() => {
        if (!process.memoryUsage || !process.availableMemory) return;
        let processHeap = process.memoryUsage().heapUsed;
        let availableMemory = process.availableMemory();
        const treshold = 25 * 1024 * 1024; // 25MB
        if (processHeap > availableMemory - treshold) {
            output.warn(`Low on memory.\nUsing: ${processHeap} of ${availableMemory} available memory.\nEclairBOT will attempt to restart if this situation occurs more than 6 times in the next 10 seconds.`);
            memoryIssuesTimes++;
            if (memoryIssuesTimes == 6) {
                output.log(`Attempting to restart EclairBOT to free up memory.`);
                process.exit(1); // start.hosting-only.js should catch this
            }
        }
    }, 500);

    setInterval(() => {
        memoryIssuesTimes = 0;
    }, 10_000);

    try {
        const messageId = await cache.load<string>('session', 'last-restart-command-message-id');
        const channelId = await cache.load<string>('session', 'last-restart-command-channel-id');
        if (messageId != undefined && channelId != undefined) {
            await cache.del('session', 'last-restart-command-message-id');
            await cache.del('session', 'last-restart-command-channel-id');

            const channel = await client.channels.fetch(channelId) as dsc.TextChannel;
            const message = await channel.messages.fetch(messageId);

            log.replySuccess(message, 'Restart zakończony', 'Istota wyższa pomyślnie i wreszcie się zrestartowała i powinna już działać poprawnie!');
        }
    } catch {}

    if (cfg.general.databaseBackups.enabled) {
        setInterval(async () => {
            let dbBackUpsChannel: dsc.GuildTextBasedChannel;
            try {
                dbBackUpsChannel = await getChannel(cfg.channels.eclairbot.dbBackups, client) as dsc.GuildTextBasedChannel;
            } catch {
                output.err('could not find the channel to send db backups');
                return;
            }
            if (!dbBackUpsChannel.isSendable()) {
                output.err('the channel with db backups is not sendable');
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
                output.err('while sending db at bot.db: ' + e);
            }
        }, cfg.general.databaseBackups.interval);
    }
}

(async function () {
    await client.login(process.env.TOKEN); 
})();
