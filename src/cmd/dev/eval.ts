import { cfg } from '@/bot/cfg.js';
import { Command, CommandFlags, CommandPermissions } from '@/bot/command.js';
import { client } from '@/client.js';
import { output } from '@/bot/logging.js';
import { db } from '@/bot/apis/db/bot-db.js';

export let canEval = cfg.legacy.general.usingNormalHosting;

setTimeout(() => {
    canEval = true;
}, 61 * 1000);

type AsynchronicFunction = () => PromiseLike<any>;

export const evalCmd: Command = {
    name: 'eval',
    description: {
        main: 'Wykonuje kod JavaScript. Jest naprawdę potencjalnie unsafe, dlatego to jest locknięte do granic możliwości.',
        short: 'Wykonuje kod JavaScript, więc jest bardzo unsafe.',
    },
    flags: CommandFlags.Important | CommandFlags.Unsafe,

    expectedArgs: [
        {
            name: 'code',
            type: { base: 'string', trailing: true },
            description: 'Kod JS do wykonania',
            optional: false,
        },
    ],
    aliases: ['exec'],
    permissions: CommandPermissions.devOnly(),

    async execute(api) {
        const AsyncFunction = Object.getPrototypeOf(async function() {}).constructor satisfies AsynchronicFunction;

        const code = api.getTypedArg('code', 'string')?.value as string;
        if (code.includes('process.exit')) {
            return api.reply('unsafe, użyj do tego komendy `restart`');
        }
        if (code.includes('bot.db') || code.includes('bot/eclair')) {
            return api.reply('wiem, ze jest do tego masa sposóbów by bypassnąć ten restriction ale plz nie pobieraj bazy danych bota; btw masz do tego db-backups');
        }
        let warns: string[] = [];
        if (code.includes('console.log') || code.includes('console.error')) {
            warns.push('`console.log` spowoduje iż na stdout przyjdzie wynik, ale może się on nie pojawić w wyniku komendy. evaluje sie funkcja wiec po prostu uzyj return by cos napisac. mozesz ten zrobic zmienna z buforem wyjscia i zwracac ja na koncu. z kolei `console.error` w ogóle nie da wyniku...');
        }
        if (!code.includes('return')) {
            warns.push("nie używasz return a masz używać...");
        }
        if (!canEval) {
            warns.push('cierpliwości nauczę cię, nie sbrickujesz mnie');
        }
        for (const warn of warns) {
            await api.log.replyTip(api, 'Ten kod może nie zadziałać!', warn);
        }
        try {
            const result = await (new AsyncFunction("api", "db", "client", "debug", "cfg", canEval ? code : 'return false;'))(api, db, client, output, cfg);
            return api.reply(`wynik twojej super komendy:\n\`\`\`${String(result).replace('`', '\`')}\`\`\``);
        } catch (err) {
            return api.reply(`❌ niepowodzenie:\n\`\`\`${err}\`\`\``);
        }
    },
};
