console.log('Welcome to EclairBOT!');

// preparation & basic imports
import { client } from '@/client.ts';
import { ft, output } from '@/bot/logging.ts';
import * as dotenv from 'dotenv';
process.on('uncaughtException', (e) => {
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
import { cfg } from './bot/cfg.ts';

// actions
import AutoModRules from '@/features/actions/mod/automod.ts';
import { initExpiredWarnsDeleter } from '@/features/deleteExpiredWarns.ts';
import { sayGoodbyeAction, welcomeNewUserAction } from '@/features/actions/others/welcomer.ts';
import { countingChannelAction } from '@/features/actions/4fun/countingChannel.ts';
import { lastLetterChannelAction } from '@/features/actions/4fun/lastLetterChannel.ts';
import { mediaChannelAction } from '@/features/actions/4fun/mediaChannelAction.ts';
import { antiSpamAndAntiFlood } from '@/features/actions/mod/anti-spam-flood.ts';
import { basicMsgCreateActions } from '@/features/actions/others/basicMsgCreateActions.ts';
import { registerTemplateChannels } from '@/features/actions/channels/registerTemplateChannels.ts';
import { channelAddWatcher, channelDeleteWatcher, onMuteGivenWatcher, onWarnGivenWatcher, setUpWatchdog } from './bot/watchdog.ts';
import { actionPing } from '@/features/actions/4fun/pingDeathChat.ts';
import { hallOfFameAction } from './features/actions/4fun/hallOfFame.ts';
import { onReceivedEmailAction } from './features/actions/others/on-new-email.ts';

// events
import { registerChannelCreateDscEvents } from './events/client/channelCreate.ts';
import { registerChannelDeleteDscEvents } from './events/client/channelDelete.ts';
import { registerMsgEditDscEvents } from './events/client/messageUpdate.ts';
import { registerMsgDeleteDscEvents } from './events/client/messageDelete.ts';

// commands
import * as slashCommands from '@/features/commands/slash.ts';
import * as legacyCommands from '@/features/commands/legacy.ts';

import * as gemini from '@/bot/apis/gemini/model.ts';
import * as email from '@/bot/apis/email/mail.ts';
import * as cache from '@/bot/apis/cache/cache.ts';

import * as log from '@/util/log.ts';

// misc
import actionsManager from '@/features/actions/index.ts';
import { db } from '@/bot/apis/db/bot-db.ts';

import { initEmailActionsIntegration } from '@/bot/apis/email/actions.ts';
import { getChannel } from '@/features/actions/channels/templateChannels.ts';
import { warnGivenLogAction } from '@/features/actions/mod/warn-given.ts';
import { initStatusGenerator } from '@/util/generateStatusQuote.ts';

import { initAskCmdModel } from './features/init-ai-models.ts';

// --------------- INIT ---------------
client.once('clientReady', async () => {
    await output.init();
    output.log(`${ft.CYAN}Logged in.`);

    await db.init();
    output.log(`Database initialized.`);

    if (!process.env.EB_EMAIL_USER || !process.env.EB_EMAIL_PASS) {
        output.warn('You should set EB_EMAIL_USER and EB_EMAIL_PASS enviorment variables to a GMail login and temporary password\nOtherwise, the e-mail based commands will not work');
    } else {
        await email.init();
        await initEmailActionsIntegration();
        output.log(`Email initialized.`);
    }

    await gemini.init();
    if (!gemini.isInitialized()) {
        output.warn('You should set EB_GEMINI_API_KEY enviroment variable to your gemini api key\nOtherwise, the Gemini integration based commands will not work');
    } else {
        initAskCmdModel();
        output.log(`Gemini initialized.`);
    }

    await cache.init();
    output.log(`Cache initialized.`);

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
    initStatusGenerator();
    initExpiredWarnsDeleter();
    setUpActions();
    setUpEvents();

    let memoryIssuesTimes = 0;

    setInterval(() => {
        if (!process.memoryUsage || !process.availableMemory) return;
        const processHeap = process.memoryUsage().heapUsed;
        const availableMemory = process.availableMemory();
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

    if (cfg.database.backups.enabled) {
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
                    content: `${cfg.database.backups.msg} (${new Date().toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw' })})`,
                    files: [{ attachment: dbPath, name: backupName }],
                });
            } catch (e) {
                output.err('while sending db at bot.db: ' + e);
            }
        }, cfg.database.backups.interval);
    }
}

(async function () {
    await client.login(process.env.TOKEN);
})();
