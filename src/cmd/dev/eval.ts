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

        const warns: string[] = [];
        if (code.src.includes('console.log') || code.src.includes('console.error')) {
            warns.push('Weź nie używaj tego deprecated czegoś, używaj namespace debug lub output.');
        }
        if (code.src.includes('await import') && !code.src.includes('SRC_ROOT')) {
            warns.push('Proszę, używaj constantu SRC_ROOT jak coś importujesz.');
        }
        if (!code.src.includes('return')) {
            warns.push('Nie używasz return. Tu sie ewaluuje funkcja a nie.');
        }
        for (const warn of warns) {
            await api.log.replyTip(api, 'Są ostrzeżenia dotyczące Twojego kodu!', warn);
        }

        try {
            const func = new AsyncFunction('api', 'db', 'client', 'debug', 'output', 'cfg', 'SRC_ROOT', code.src);
            const result = await func(api, db, client, output, output, cfg, '../..');
            const sanitized = JSON5.stringify(result, null, 4)?.replace('```', '\`\`\`') ?? String(result);
            return api.log.replySuccess(api, 'Wynik twojej super komendy!', `\n\`\`\`js\n${sanitized}\`\`\``);
        } catch (err) {
            return api.log.replyError(api, 'Masz problem', `\n\`\`\`${err}\`\`\``);
        }
    },
};
