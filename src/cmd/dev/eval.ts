import { cfg } from '@/bot/cfg.js';
import { Command, CommandFlags } from '@/bot/command.js';
import * as dsc from 'discord.js';
import * as log from '../../util/log.js';
import { deepMerge } from '@/util/objects.js';

let canEval = false;

setTimeout(() => {
    canEval = true;
}, 61 * 1000);

export const evalCmd: Command = {
    name: 'eval',
    description: {
        main: 'Wykonuje kod JavaScript. Jest naprawdę potencjalnie unsafe, dlatego to jest locknięte do granic możliwości.',
        short: 'Wykonuje kod JavaScript, więc jest bardzo unsafe.',
    },
    flags: CommandFlags.Important,

    expectedArgs: [
        { name: 'code', type: 'trailing-string', description: 'Kod JS do wykonania', optional: false },
    ],
    aliases: [],
    permissions: {
        discordPerms: [],
        allowedRoles: cfg.devPerms.allowedRoles,
        allowedUsers: cfg.devPerms.allowedUsers,
    },

    async execute(api) {
        const code = api.getTypedArg('code', 'trailing-string')?.value as string;
        if (code.includes('process.exit')) {
            return api.msg.reply('unsafe, użyj do tego komendy `restart`');
        }
        if (code.includes('bot.db') || code.includes('bot/eclair')) {
            return api.msg.reply('wiem, ze jest do tego masa sposóbów by bypassnąć ten restriction ale plz nie pobieraj bazy danych bota');
        }
        let warns: string[] = [];
        if (code.includes('console.log') || code.includes('console.error')) {
            warns.push('`console.log` spowoduje iż gorciu dostanie dm z wynikiem, ale może się on nie pojawić w wyniku komendy. evaluje sie funkcja wiec po prostu uzyj return by cos napisac. mozesz ten zrobic zmienna z buforem wyjscia i zwracac ja na koncu. z kolei `console.error` w ogóle nie da wyniku...');
        }
        if (code.includes('return') && !code.startsWith('(async function')) {
            warns.push('używasz return, ale nie komendy exec, więc coś się zepsuje...');
        }
        if (!canEval) {
            warns.push('cierpliwości nauczę cię, nie sbrickujesz mnie');
        }
        for (const warn of warns) {
            await log.replyTip(api.msg, 'Ten kod może nie zadziałać!', warn);
        }
        try {
            const result = await eval(`${canEval ? code : 'false'}`);
            return api.msg.reply(`wynik twojej super komendy:\n\`\`\`${String(result).replace('`', '\`')}\`\`\``);
        } catch (err) {
            return api.msg.reply(`❌ niepowodzenie:\n\`\`\`${err}\`\`\``);
        }
    },
};

export const execCmd: Command = {
    name: 'exec',
    description: {
        main: 'Wykonuje kod JavaScript. Jest naprawdę potencjalnie unsafe, dlatego to jest locknięte do granic możliwości.',
        short: 'Wykonuje kod JavaScript, więc jest bardzo unsafe.',
    },
    flags: CommandFlags.Important,
    expectedArgs: [
        { name: 'code', type: 'trailing-string', description: 'Kod JS do wykonania', optional: false },
    ],
    aliases: [],
    permissions: {
        discordPerms: [],
        allowedRoles: cfg.devPerms.allowedRoles,
        allowedUsers: cfg.devPerms.allowedUsers,
    },

    async execute(api) {
        await evalCmd.execute(deepMerge(api, {getTypedArg: (name, type) => {
            if (name == 'code') {
                let arg = api.getTypedArg('code', type);
                return deepMerge(arg, {value: `(async function () {${arg.value}})();`});
            }
            return api.getTypedArg(name, type);
        }}));
    },
};
