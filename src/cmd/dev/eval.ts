import { cfg } from '@/bot/cfg.ts';
import { Command, CommandAPI } from '@/bot/command.ts';
import { CommandFlags } from '@/bot/apis/commands/misc.ts';
import { CommandPermissions } from '@/bot/apis/commands/permissions.ts';
import { client } from '@/client.ts';
import { output } from '@/bot/logging.ts';
import { db } from '@/bot/apis/db/bot-db.ts';

import JSON5 from 'json5';
import process from 'node:process';

type AsyncFunction = () => PromiseLike<unknown>;
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor satisfies AsyncFunction;

async function doEval(api: CommandAPI, src: string): Promise<unknown> {
    const func = new AsyncFunction('api', 'db', 'client', 'debug', 'output', 'cfg', 'SRC_ROOT', 'i', src);
    const doImport = async (path: string) => import('../../' + path);

    const result = await func(api, db, client, output, output, cfg, '../..', doImport);
    return result;
}

const evalCmd: Command = {
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
        
        if (warns.length != 0) {
            const warnsString = warns.map(w => `- ${w}`).join('\n');
            await api.log.replyTip(api, 'Są ostrzeżenia dotyczące Twojego kodu!', warnsString);
        }

        try {
            const result = await doEval(api, code.src);
            if (result) {
                const sanitized = JSON5.stringify(result, null, 4)?.replace('```', '\`\`\`') ?? String(result);
                if (sanitized.length >= 4096 - 10) {
                    return api.log.replyWarn(api, 'Za długi output', 'Tak w skrócie, to twój kod wyprodukował za długi output jak na discorda.');
                }
                if (sanitized.includes(process.env.TOKEN ?? 'ebtoken')) {
                    return api.log.replyWarn(api, 'Błąd', 'Właśnie próbujesz zleakować token. Możesz sie bawić w obchodzenie tego ale błagam po prostu skopiuj z .env z hostingu.');
                }
                return api.log.replySuccess(api, 'Wynik twojej super komendy!', `\n\`\`\`js\n${sanitized}\`\`\``);
            }
            return api.log.replySuccess(api, 'Wykonano', 'W skrócie to twój kod się wykonał, ale nie zwrócił żadnego wyniku (użyj return)');
        } catch (err) {
            return api.log.replyError(api, 'Masz problem', `\n\`\`\`${err}\`\`\``);
        }
    },
};

export default evalCmd;
