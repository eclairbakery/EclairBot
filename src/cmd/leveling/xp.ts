import { Command } from '../../bot/command.js';
import { cfg } from '../../bot/cfg.js'
import { db, sqlite } from '../../bot/db.js';

import * as log from '../../util/log.js';
import * as cfgManager from '../../bot/cfgManager.js';
import * as automod from '../../bot/automod.js';

import * as dsc from 'discord.js';
import { PredefinedColors } from '../../util/color.js';

export const xpCmd: Command = {
    name: 'xp',
    desc: 'Dodaj komuś levela... Jak nadużyjesz, no to, chyba nie wiesz z jaką siłą igrasz! Pospólstwo jak pomyśli, że sobie za darmoszkę doda poziomów, no to nie! Do widzenia.',
    category: 'poziomy',
    expectedArgs: [
        {
            name: 'user',
            desc: 'Użytkownik, którego chcesz zjeść... lub mu delikatnie pomóc z levelem...'
        },
        {
            name: 'action',
            desc: 'No co chcesz zrobić z tym levelem? Dać misiowi puchatkowi?'
        },
        {
            name: 'amount',
            desc: 'Ile levela obejmuje ta Twoja komenda...'
        },
        {
            name: 'affect',
            desc: 'Czego dotyczy Twoja komenda? Punktów XP czy leveli? Po prostu piszesz `levels` albo `xp`.'
        }
    ],

    aliases: [],
    allowedRoles: cfg.general.leveling.canChangeXP,
    allowedUsers: [],

    execute(msg, args) {
        let to_who = msg.mentions.users.first();
        let action = args[1];
        let amount: number = (args[2] as any as number);
        let should_leveler: boolean = args[3] ? args[3] === 'levels' : true;

        if (!args[0] || !args[0].startsWith('<@') || args[0].startsWith('<@&')) {
            return log.replyError(msg, 'Argument numer jeden niepoprawny!', 'Jakby to ująć, podaj jako pierwszy argument usera...');
        }
        if (action !== 'delete' && action !== 'set' && action !== 'add') {
            return log.replyError(msg, 'Argument akcji niepoprawny!', 'Hej, chłopie!!! Panie!!! Co ja mam z tym levelem zrobić? Dać misiowi puchatkowi? No to proste jak oddychanie z butli pod wodą: wpisujesz `delete`, `add` lub `set`!');
        }
        if (!/^\d+$/.test((amount as any as string))) {
            return log.replyError(msg, 'Argument numeru niepoprawny!', 'Ile tego levela, punktów itd? No ile? Ja się sam nie domyślę!');
        } else {
            amount = parseInt((amount as any as string));
        }
        if (should_leveler) amount = cfg.general.leveling.level_divider * (amount * (amount - 1) / 2);

        if (action === 'add') {
            db.run(
                `INSERT INTO leveling (user_id, xp)
                VALUES (?, ?)
                ON CONFLICT(user_id) DO UPDATE SET xp = xp + excluded.xp`,
                [to_who.id, amount]
            );
        } else if (action === 'set') {
            db.run(
                `INSERT INTO leveling (user_id, xp)
                VALUES (?, ?)
                ON CONFLICT(user_id) DO UPDATE SET xp = excluded.xp`,
                [to_who.id, amount]
            );
        } else if (action === 'delete') {
            db.run(
                `UPDATE leveling
                SET xp = CASE WHEN xp >= ? THEN xp - ? ELSE 0 END
                WHERE user_id = ?`,
                [amount, amount, to_who.id]
            );
        }

        log.replySuccess(msg, 'Udało się!', "Wykonałem akcję, krótko mówiąc...")
    }
}