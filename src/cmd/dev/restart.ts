import { Command, CommandFlags, CommandPermissions } from '@/bot/command.js';
import { output } from '@/bot/logging.js';

import * as cache from '@/bot/apis/cache/cache.js';

export const restartCmd: Command = {
    name: 'restart',
    description: {
        main: 'Restartuje bota... Nie tykaj!',
        short: 'Szybki restart bota!',
    },
    flags: CommandFlags.Important,
    expectedArgs: [],
    aliases: [],
    permissions: CommandPermissions.devOnly(),

    async execute(api) {
        output.log('Issued restart. This will work due to the behaviour of Pterodactyl Daemon.');
        await api.reply('jusz siem restartujem plis łejt plis plis plis łejt');
        
        if (api.raw.msg) {
            await cache.store('session', 'last-restart-command-message-id', api.raw.msg?.id);
            await cache.store('session', 'last-restart-command-channel-id', api.channel?.id);
        }
        process.exit(1);
    },
};
