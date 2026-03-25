import { cfg } from '@/bot/cfg.ts';
import { Command } from '@/bot/command.ts';
import { CommandFlags } from '@/bot/apis/commands/misc.ts';
import { CommandPermissions } from '@/bot/apis/commands/permissions.ts';
import { client } from '@/client.ts';
import { output } from '@/bot/logging.ts';
import { db } from '@/bot/apis/db/bot-db.ts';

import JSON5 from 'json5';

type AsynchronicFunction = () => PromiseLike<unknown>;

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
            type: { base: 'code', trailing: true },
            description: 'Kod JS do wykonania',
            optional: false,
        },
    ],
    aliases: ['exec'],
    permissions: CommandPermissions.devOnly(),

    async execute(api) {
        const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor satisfies AsynchronicFunction;

        const code = api.getTypedArg('code', 'code')?.value;
        if (code.lang && (code.lang != 'js' && code.lang != 'javascript')) {
            if (code.lang == 'ts' || code.lang == 'typescript') {
                return api.log.replyError(api, 'Błąd', 'Eval używa JS a nie TS. Powód? sam nie wiem.')
            }
            return api.log.replyError(api, 'Błąd', 'Eval przyjmuje kod w JS tak w skrócie.');
        }

        if (code.src.includes('process.exit')) {
            return api.reply('unsafe, użyj do tego komendy `restart`');
        }
        if (code.src.includes('bot.db') || code.src.includes('bot/eclair')) {
            return api.reply('wiem, ze jest do tego masa sposóbów by bypassnąć ten restriction ale plz nie pobieraj bazy danych bota; btw masz do tego db-backups');
        }

        const warns: string[] = [];
        if (code.src.includes('console.log') || code.src.includes('console.error')) {
            warns.push('`console.log` spowoduje iż na stdout przyjdzie wynik, ale może się on nie pojawić w wyniku komendy. evaluje sie funkcja wiec po prostu uzyj return by cos napisac. mozesz ten zrobic zmienna z buforem wyjscia i zwracac ja na koncu. z kolei `console.error` w ogóle nie da wyniku...');
        }
        if (!code.src.includes('return')) {
            warns.push('nie używasz return a masz używać...');
        }
        for (const warn of warns) {
            await api.log.replyTip(api, 'Ten kod może nie zadziałać!', warn);
        }
        try {
            const func = new AsyncFunction('api', 'db', 'client', 'debug', 'cfg', code.src);
            const result = await func(api, db, client, output, cfg);
            const sanitized = JSON5.stringify(result, null, 4).replace('```', '\`\`\`');
            return api.reply(`wynik twojej super komendy:\n\`\`\`${sanitized}\`\`\``);
        } catch (err) {
            return api.reply(`❌ niepowodzenie:\n\`\`\`${err}\`\`\``);
        }
    },
};
