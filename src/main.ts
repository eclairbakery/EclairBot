console.log('Welcome to EclairBOT!');

// preparation & basic imports
import { client } from '@/client.ts';
import { ft, output } from '@/bot/logging.ts';
import * as dotenv from 'dotenv';
import process from 'node:process';
import logError from '@/util/log-error.ts';
process.on('uncaughtException', (e) => {
    logError('stderr', e);
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
import { initExpiredWarnsDeleter } from '@/features/delete-expired-warns.ts';
import { sayGoodbyeAction, welcomeNewUserAction } from '@/features/actions/others/welcomer.ts';
import { countingChannelAction } from '@/features/actions/4fun/counting-channel.ts';
import { lastLetterChannelAction } from '@/features/actions/4fun/last-letter-channel.ts';
import { mediaChannelAction } from '@/features/actions/4fun/media-channel-action.ts';
import { basicMsgCreateActions } from '@/features/actions/others/basic-msg-create-actions.ts';
import { registerTemplateChannels } from '@/features/actions/channels/register-template-channels.ts';
import { channelAddWatcher, channelDeleteWatcher, onMuteGivenWatcher, onWarnGivenWatcher, setUpWatchdog } from './bot/watchdog.ts';
import { actionPing } from '@/features/actions/4fun/pingDeathChat.ts';
import { onReceivedEmailAction } from './features/actions/others/on-new-email.ts';

// events
import { registerChannelCreateDscEvents } from './events/client/channelCreate.ts';
import { registerChannelDeleteDscEvents } from './events/client/channelDelete.ts';
import { registerMsgEditDscEvents } from './events/client/messageUpdate.ts';
import { registerMsgDeleteDscEvents } from './events/client/messageDelete.ts';

// commands
import * as slashCommands from '@/features/commands/slash.ts';
import * as prefixCommands from '@/features/commands/prefix.ts';

// integrations
import * as github from '@/bot/apis/github/github.ts';
import * as gemini from '@/bot/apis/gemini/model.ts';
import * as email from '@/bot/apis/email/mail.ts';
import * as cache from '@/bot/apis/cache/cache.ts';

// misc
import * as log from '@/util/log.ts';

import actionsManager from '@/features/actions/index.ts';
import { db } from '@/bot/apis/db/bot-db.ts';

import { initEmailActionsIntegration } from '@/bot/apis/email/actions.ts';
import { getChannel } from '@/features/actions/channels/template-channels.ts';
import { warnGivenLogAction } from '@/features/actions/mod/warn-given.ts';
import { initStatusGenerator } from '@/util/generate-status-quote.ts';

import { initAskCmdModel, initWikiModel } from './features/init-ai-models.ts';
import { askAction } from './features/actions/4fun/ask.ts';
import { addVoiceExperience } from '@/bot/level.ts';
import { addMusicAction } from '@/features/actions/4fun/add-music.ts';
import { registerCommands } from '@/cmd/list.ts';
import { communityPollsContentModerator, filesContentModerator } from '@/features/actions/others/content-moderator.ts';

// --------------- INIT ---------------
client.once('clientReady', async () => {
    await output.init();
    output.log(`${ft.CYAN}Logged in.`);
    if (process.env.EB_DEVELOPMENT == 'true') {
        output.verbose(
            '------------------------------------------------\n' + 
            'Verbose logging enabled.\n' +
            'EclairBOT will log more detailed output.\n' +
            'To disable this behaviour, please set\n' +
            'EB_DEVELOPMENT to false or unset this variable.\n' + 
            '------------------------------------------------'
        );
    }

    try {
        await Deno.mkdir('/tmp/eclairbot');
    } catch {}

    await registerCommands();
    output.verbose('Commands registered');

    await db.init();
    output.verbose(`Database initialized.`);

    addVoiceExperience();

    if (!process.env.EB_EMAIL_USER || !process.env.EB_EMAIL_PASS) {
        output.warn('You should set EB_EMAIL_USER and EB_EMAIL_PASS enviorment variables to a GMail login and temporary password\nOtherwise, the e-mail based commands will not work');
    } else {
        await email.init();
        await initEmailActionsIntegration();
        output.verbose(`Email initialized.`);
    }

    await gemini.init();
    if (!gemini.isInitialized()) {
        output.warn('You should set EB_GEMINI_API_KEY enviroment variable to your Gemini api key\nOtherwise, the Gemini integration based commands will not work');
    } else if (cfg.features.ai.enabled) {
        initAskCmdModel();
        initWikiModel();
        output.verbose(`Gemini initialized.`);
    }

    await github.init();
    output.verbose(`Github integration initialized`);

    await cache.init();
    output.verbose(`Cache initialized.`); 

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
        // automod
        ...AutoModRules.all(),
        filesContentModerator,
        communityPollsContentModerator,
        // msg-specific actions 
        mediaChannelAction,
        countingChannelAction,
        lastLetterChannelAction,
        basicMsgCreateActions,
        askAction,
        // additional features
        actionPing,
        warnGivenLogAction,
        onReceivedEmailAction,
        addMusicAction
    );
    registerTemplateChannels(client);
    slashCommands.init();
    prefixCommands.init();
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

            message.edit({
                embeds: [
                    log.getSuccessEmbed('Restart zakończony', 'Istota wyższa pomyślnie i wreszcie się zrestartowała i powinna już działać poprawnie!')
                ]
            }); 
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
                logError('stdwarn', e, "Database backups"); 
            }
        }, cfg.database.backups.interval);
    }
}

(async function () {
    await client.login(process.env.TOKEN);
})();
