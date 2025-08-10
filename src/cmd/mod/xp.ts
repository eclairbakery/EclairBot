import { Command } from '../../bot/command';
import { cfg } from '../../bot/cfg'
import { db, sqlite } from '../../bot/db';

import * as log from '../../util/log';
import * as cfgManager from '../../bot/cfgManager';
import * as automod from '../../bot/automod';

import * as dsc from 'discord.js';
import { PredefinedColors } from '../../util/color';

export const warnlistCmd: Command = {
    name: 'xp',
    desc: 'Dodaj komuś levela... Jak nadużyjesz, no to, chyba nie wiesz z jaką siłą igrasz! Pospólstwo jak pomyśli, że sobie za darmoszkę doda poziomów, no to nie! Do widzenia.',
    category: 'moderacyjne rzeczy',
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

    aliases: ['warnlista'],
    allowedRoles: null,
    allowedUsers: [],

    execute(msg, args) {
        let to_who = msg.mentions.users.first();
        let action = args[1];
        let amount: number = (args[2] as any as number);
        let should_multiply_by_100: boolean = args[3] ? args[3] === 'levels' : true;

        if (!args[0].startsWith('<@') || args[0].startsWith('<@&')) {
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
        if (should_multiply_by_100) amount = amount * 100;

        db.run(
            `INSERT INTO users (user_id, xp) VALUES (?, ?)
            ON CONFLICT(user_id) DO UPDATE SET xp = xp + excluded.xp`,
            [to_who.id, amount]
        );
    }
}