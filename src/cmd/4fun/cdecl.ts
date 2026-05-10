import { Command } from '@/bot/command.ts';
import { CommandFlags } from '@/bot/apis/commands/misc.ts';

import cdecl from '@/bot/apis/cdecl/cdecl.ts';

const cdeclCmd: Command = {
    name: 'cdecl',
    aliases: [],
    description: {
        main: 'Tłumaczenie C gibberish ↔ English',
        short: 'Tłumaczenie C gibberish ↔ English',
    },
    flags: CommandFlags.None,

    expectedArgs: [
        {
            type: { base: 'string', trailing: true },
            name: 'query',
            description: 'Deklaracja/cast C/C++',
            optional: false,
        }
    ],

    permissions: {
        allowedRoles: null,
        allowedUsers: null,
    },

    async execute(api) {
        const query = api.getTypedArg('query', 'string').value;
        try {
            const result = await cdecl(query);
            return api.reply(`\`${result}\``);
        } catch (err) {
            const msg = err instanceof Error ? err.message : `${err}`;
            return api.log.replyError(
                api, 'Błąd',
                `Podaj poprawną deklaracje w C.\nKod błędu: \`\`\`${msg}\`\`\``
            );
        }
    }
};

export default cdeclCmd;
