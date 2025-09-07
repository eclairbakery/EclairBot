import { Command } from '@/bot/command.js';
import { cfg } from '@/bot/cfg.js';
import { db, sqlite } from '@/bot/db.js';

import * as log from '@/util/log.js';
import * as dsc from 'discord.js';

import { PredefinedColors } from '@/util/color.js';
import capitalizeFirst from '@/util/capitalizeFirst.js';

const neocitiesPages = [
    'https://melonking.net',
    'https://chlebek.neocities.org',
    'https://gorciu.neocities.org',
    'https://youcantsitwithus.neocities.org',
    'https://cinni.net',
    'https://neocities.org/browse',
    'https://nekoweb.org',
    'https://00s.neocities.org',
    'https://y2kid.xyz'
];

const nonNeocitiesPages = [
    'https://spacehey.com',
    'https://youtube.com',
    'https://web.whatsapp.com',
    'https://fusionanomaly.net/',
    'https://chatgpt.com',
    'https://bard.google.com',
    'https://gemini.google.com',
    'https://grok.com',
    'https://copilot.microsoft.com',
    'https://internet.com'
];

export const randsiteCmd: Command = {
    name: 'randsite',
    description: {
        main: 'Siema... Czujesz się fajnie? Chcesz eksploracji? Tą komendą wyświetlisz losową stronę na Internecie.',
        short: 'Tą komendą wyświetlisz losową stronę na Internecie.',
    },
    expectedArgs: [
        {
            name: 'neocities-bypass',
            description: 'Napisz tutaj `all` by nie wyświetlało tylko stron z Neocities/Nekoweb',
            optional: true,
            type: 'string'
        }
    ],
    aliases: [],
    permissions: {
        discordPerms: [],
        allowedRoles: null,
        allowedUsers: null,
    },

    async execute(api) {
        const everything = [...neocitiesPages];
        if ((api.getTypedArg('neocities-bypass', 'string').value as string ?? 'xd').includes('all')) everything.push(...nonNeocitiesPages);
        return api.msg.reply(everything[Math.floor(Math.random() * everything.length)]);
    },
};