import { cfg } from '@/bot/cfg.js';
import { db } from '@/bot/db.js';

import * as dsc from 'discord.js';
import * as log from '@/util/log.js';
import { Command, CommandAPI, CommandFlags } from '@/bot/command.js';
import { levelToXp, OnSetXpEvent } from '@/bot/level.js';
import actionsManager from '@/features/actions/index.js';
import { output } from '@/bot/logging.js';

export const xpCmd: Command = {
    name: 'xp',
    aliases: [],
    description: {
        main: 'Dodaj komuś levela... Jak nadużyjesz, no to, chyba nie wiesz z jaką siłą igrasz! Pospólstwo jak pomyśli, że sobie za darmoszkę doda poziomów, no to nie! Do widzenia.',
        short: 'Komenda dla adminów, by bawić się levelem...',
    },
    flags: CommandFlags.None,

    permissions: {
        discordPerms: null,
        allowedRoles: cfg.features.leveling.canChangeXP,
        allowedUsers: [],
    },
    expectedArgs: [
        {
            type: 'user-mention',
            optional: false,
            name: 'user',
            description: 'Użytkownik, którego chcesz zjeść... lub mu delikatnie pomóc z levelem...',
        },
        {
            type: 'string',
            optional: false,
            name: 'action',
            description: 'Co chcesz zrobić z levelem? `add`, `set` lub `delete`',
        },
        {
            type: 'number',
            optional: false,
            name: 'amount',
            description: 'Ile levela lub XP chcesz dodać/ustawić/usunąć',
        },
        {
            type: 'string',
            optional: true,
            name: 'affect',
            description: 'Czy dotyczy `levels` czy `xp` (domyślnie levels)',
        }
    ],

    async execute(api: CommandAPI) {
        const targetUser = api.getTypedArg('user', 'user-mention')?.value as dsc.GuildMember ?? api.msg.member!.plainMember;
        const actionStr = api.getTypedArg('action', 'string')?.value as string;
        let amount = api.getTypedArg('amount', 'number')?.value as number;
        const affect = api.getTypedArg('affect', 'string')?.value as string ?? 'levels';

        if (!targetUser || !actionStr || amount === undefined) {
            return api.log.replyError(api.msg, 'Niepoprawne argumenty', 'Sprawdź składnię komendy i spróbuj ponownie.');
        }

        let shouldLeveler = affect === 'levels';
        if (shouldLeveler) {
            amount = levelToXp(amount, cfg.features.leveling.levelDivider);
        }

        if (actionStr != 'set' && actionStr != 'add' && actionStr != 'delete') {
            return api.log.replyError(api.msg, 'Nie poprawna akcja', 'Argument `action` powinien być `set`, `add` lub `delete`!');
        }
        const action = actionStr as 'set' | 'add' | 'delete';

        try {
            await actionsManager.emit(OnSetXpEvent, {
                userID: targetUser.id,
                user: targetUser,
                guild: api.msg?.guild,
                action: action,
                amount: amount,
            });

            api.log.replySuccess(api.msg, 'Udało się!', `Wykonałem akcję na użytkowniku **${targetUser.user.tag}**`);
        } catch (err) {
            output.err(err);
            api.log.replyError(api.msg, 'Błąd wykonania', 'Coś poszło nie tak podczas modyfikacji XP/levela.');
        }
    },
};
