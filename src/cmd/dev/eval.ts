import { cfg } from '@/bot/cfg.js';
import { Command, CommandFlags } from '@/bot/command.js';
import * as dsc from 'discord.js';
import * as log from '../../util/log.js';
import { deepMerge } from '@/util/objects/objects.js';
import { client } from '@/client.js';
import { output } from '@/bot/logging.js';
import { db } from '@/bot/apis/db/bot-db.js';

export let canEval = cfg.general.usingNormalHosting;

setTimeout(() => {
    canEval = true;
}, 61 * 1000);

export const evalCmd: Command = {
    name: 'eval',
    description: {
        main: 'Wykonuje kod JavaScript. Jest naprawdę potencjalnie unsafe, dlatego to jest locknięte do granic możliwości.',
        short: 'Wykonuje kod JavaScript, więc jest bardzo unsafe.',
    },
    flags: CommandFlags.Important | CommandFlags.Unsafe,

    expectedArgs: [
        { name: 'code', type: 'trailing-string', description: 'Kod JS do wykonania', optional: false },
    ],
    aliases: ['exec'],
    permissions: {
        discordPerms: [],
        allowedRoles: cfg.devPerms.allowedRoles,
        allowedUsers: cfg.devPerms.allowedUsers,
    },

    async execute(api) {
        const code = api.getTypedArg('code', 'trailing-string')?.value as string;
        if (code.includes('process.exit')) {
            return api.reply(cfg.customization.evalWarnings.unsafeEval);
        }
        if (code.includes('bot.db') || code.includes('bot/eclair')) {
            return api.reply(cfg.customization.evalWarnings.doNotDownloadDatabase);
        }
        let warns: string[] = [];
        if (code.includes('console.log') || code.includes('console.error')) {
            warns.push(cfg.customization.evalWarnings.consoleLogWarn);
        }
        if (!code.includes('return')) {
            warns.push(cfg.customization.evalWarnings.execReturnWarn);
        }
        if (!canEval) {
            warns.push(cfg.customization.evalWarnings.wait);
        }
        for (const warn of warns) {
            await api.log.replyTip(api.msg, 'Ten kod może nie zadziałać!', warn);
        }
        try {
            const result = await (new Function("api", "db", "client", "debug", canEval ? code : 'return false;'))(api, db, client, output);
            return api.reply(`wynik twojej super komendy:\n\`\`\`${String(result).replace('`', '\`')}\`\`\``);
        } catch (err) {
            return api.reply(`❌ niepowodzenie:\n\`\`\`${err}\`\`\``);
        }
    },
};