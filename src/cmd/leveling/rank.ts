import { Command } from '@/bot/command.ts';
import { CommandFlags } from '@/bot/apis/commands/misc.ts';

import { db } from '@/bot/apis/db/bot-db.ts';

export const rankCmd: Command = {
    name: 'rank',
    aliases: [],
    description: {
        main: 'Sprawdź swoje miejsce w rankingu levela, jeśli nie jesteś w topce (looser btw)',
        short: 'Sprawdź swoje miejsce w rankingu xp',
    },
    flags: CommandFlags.None,

    expectedArgs: [
        {
            name: 'user',
            description: 'Użytkownik którego ranking chcesz sprawdzić',
            type: { base: 'user-mention' },
            optional: true,
        }
    ],

    permissions: {
        allowedRoles: null,
        allowedUsers: null,
    },

    async execute(api) {
        const userArg = api.getTypedArg('user', 'user-mention')?.value;
        const user = userArg?.user ?? api.invoker.user;

        const top = await db.leveling.getTop();
        const index = top.findIndex((value) => value.id == user.id);

        return api.log.replyTip(
            api, 'Twoje miejsce w rankingu',
            `Twoje miejsce w rankingu to: **${index + 1}**`
        );
    }
};

export default rankCmd;
