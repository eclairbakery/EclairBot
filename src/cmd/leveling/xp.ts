import { cfg } from '@/bot/cfg.js';
import { db } from '@/bot/db.js';

import * as dsc from 'discord.js';
import * as log from '@/util/log.js';
import { Command, CommandAPI } from '@/bot/command.js';

export const xpCmd: Command = {
    name: 'xp',
    description: {
        main: 'Dodaj komuś levela... Jak nadużyjesz, no to, chyba nie wiesz z jaką siłą igrasz! Pospólstwo jak pomyśli, że sobie za darmoszkę doda poziomów, no to nie! Do widzenia.',
        short: 'Komenda dla adminów, by bawić się levelem...',
    },
    permissions: {
        discordPerms: null,
        allowedRoles: cfg.general.leveling.canChangeXP,
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
    aliases: [],

    async execute(api: CommandAPI) {
        const toWho = api.getTypedArg('user', 'user-mention')?.value as dsc.GuildMember ?? api.msg.member.plainMember;
        const action = api.getTypedArg('action', 'string')?.value as string;
        let amount = api.getTypedArg('amount', 'number')?.value as number;
        const affect = api.getTypedArg('affect', 'string')?.value as string ?? 'levels';

        if (!toWho || !action || amount === undefined) {
            return log.replyError(api.msg, 'Niepoprawne argumenty', 'Sprawdź składnię komendy i spróbuj ponownie.');
        }

        let shouldLeveler = affect === 'levels';
        if (shouldLeveler) {
            amount = cfg.general.leveling.levelDivider * (amount * (amount - 1) / 2);
        }

        try {
            if (action === 'add') {
                db.run(
                    `INSERT INTO leveling (user_id, xp)
                     VALUES (?, ?)
                     ON CONFLICT(user_id) DO UPDATE SET xp = xp + excluded.xp`,
                    [toWho.id, amount]
                );
            } else if (action === 'set') {
                db.run(
                    `INSERT INTO leveling (user_id, xp)
                     VALUES (?, ?)
                     ON CONFLICT(user_id) DO UPDATE SET xp = excluded.xp`,
                    [toWho.id, amount]
                );
            } else if (action === 'delete') {
                db.run(
                    `UPDATE leveling
                     SET xp = CASE WHEN xp >= ? THEN xp - ? ELSE 0 END
                     WHERE user_id = ?`,
                    [amount, amount, toWho.id]
                );
            } else {
                return log.replyError(api.msg, 'Niepoprawna akcja', 'Akcja musi być `add`, `set` lub `delete`.');
            }

            log.replySuccess(api.msg, 'Udało się!', `Wykonałem akcję na użytkowniku **${toWho.user.tag}**`);
        } catch (err) {
            console.error(err);
            log.replyError(api.msg, 'Błąd wykonania', 'Coś poszło nie tak podczas modyfikacji XP/levela.');
        }
    },
};