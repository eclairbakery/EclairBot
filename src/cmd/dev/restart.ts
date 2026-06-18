import { Command } from '@/bot/command.ts';
import { CommandFlags } from '@/bot/apis/commands/misc.ts';
import { CommandPermissions } from '@/bot/apis/commands/permissions.ts';
import { output } from '@/bot/logging.ts';

import * as cache from '@/bot/apis/cache/cache.ts';
import process from 'node:process';

const restartCmd: Command = {
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
        output.log('Shutting down...');
        const msg = await api.log.replyInfo(api, 'Zaczekaj chwilę...', 'EclairBOT powinien być za chwilę gotowy. Gdy się zrestartuje, ta wiadomość zmieni się na wiadomość sukcesu.');

        if (api.raw.msg) {
            await cache.store('session', 'last-restart-command-message-id', msg.id);
            await cache.store('session', 'last-restart-command-channel-id', (api.raw.msg?.channel ?? api.raw.interaction?.channel!).id);
        }
        process.exit(1);
    },
};

export default restartCmd;
