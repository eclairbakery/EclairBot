import { Command } from '@/bot/command.ts';
import { CommandFlags } from '@/bot/apis/commands/misc.ts';

import { db } from '@/bot/apis/db/bot-db.ts';
import User from '@/bot/apis/db/user.ts';

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

        await (new User(user.id)).ensureExists();

        const top_lvl = await db.leveling.getTop();
        const index_lvl = top_lvl.findIndex((value) => value.id == user.id);

        const top_rep = await db.prestige.getTop();
        const index_rep = top_rep.findIndex((value) => value.id == user.id);

        const top_eco = await db.economy.getTopTotal();
        const index_eco = top_eco.findIndex((value) => value.id == user.id);

        api.reply({
            embeds: [
                (api.log.getInfoEmbed(
                    'Twoje miejsce w rankingach', 
                    `Aktualnie znajdujesz się:\n` +
                    `- na miejscu **${index_lvl + 1}** w rankingu poziomów\n` +
                    `- na miejscu **${index_rep + 1}** w rankingu prestiżu\n` +
                    `- na miejscu **${index_eco + 1}** w rankingu ekonomii`
                ))
                .setThumbnail(user.displayAvatarURL())
            ]
        });
    }
};

export default rankCmd;
