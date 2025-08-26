import { Command, Category } from '../../bot/command.js';
import { cfg } from '../../bot/cfg.js';
import { db, sqlite } from '../../bot/db.js';

import * as log from '../../util/log.js';
import * as cfgManager from '../../bot/cfgManager.js';

import * as dsc from 'discord.js';
import { PredefinedColors } from '../../util/color.js';
import capitalizeFirst from '../../util/capitalizeFirst.js';

const neocitiesPages = [
    'https://melonking.net',
    'https://chlebek.neocities.org',
    'https://gorciu.neocities.org',
    'https://youcantsitwithus.neocities.org'
];

const nonNeocitiesPages = [
    'https://spacehey.com'
];

export const randsiteCmd: Command = {
    name: 'randsite',
    longDesc: 'Siema... Czujesz się fajnie? Chcesz eksploracji? Tą komendą wyświetlisz losową stronę na Internecie.',
    shortDesc: 'Tą komendą wyświetlisz losową stronę na Internecie.',
    expectedArgs: [
        {
            name: 'neocities-bypass',
            desc: 'Napisz tutaj `all` by nie wyświetlało tylko stron z Neocities/Nekoweb'
        }
    ],
    aliases: [],
    allowedRoles: null,
    allowedUsers: [],

    async execute(msg, args, commands) {
        const everything = [...neocitiesPages];
        if (args.includes('all')) everything.push(...nonNeocitiesPages);
        return msg.reply(everything[Math.floor(Math.random() * everything.length)]);
    },
};