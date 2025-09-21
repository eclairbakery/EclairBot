import { Command, CommandFlags } from '@/bot/command.js';
import { cfg } from '@/bot/cfg.js'
import { db, sqlite } from '@/bot/db.js';

import * as log from '@/util/log.js';
import * as dsc from 'discord.js';

import { PredefinedColors } from '@/util/color.js';
import { dbGet } from '@/util/db-utils.js';

async function getGIF(searchTerm: string): Promise<string> {
    const apiKey = process.env.TENOR_API;
    const url = `https://tenor.googleapis.com/v2/search?q=${searchTerm}&key=${apiKey}&limit=1&random=true&media_filter=minimal`;

    try {
        const response = await fetch(url);
        const json = (await response.json()) as any;

        if (json.results && json.results.length > 0) {
            return json.results[0].media_formats.gif.url;
        } else {
            return 'Nie znaleziono!';
        }
    } catch (error) {
        console.error('Błąd podczas pobierania GIFa:', error);
        return 'Wystąpił błąd!';
    }
}

export const catCmd: Command = {
    name: 'cat',
    aliases: ['kot'],
    description: {
        main: 'Lubisz koty? Jakże pięknie się składa. Możemy Ci pokazać losowego kota.',
        short: 'Pokazuje losowego kota',
    },
    flags: CommandFlags.None,

    expectedArgs: [],

    permissions: {
        discordPerms: [],
        allowedRoles: null,
        allowedUsers: null
    },

    async execute(api) {
        api.msg.reply(await getGIF('cat'));
    }
};

export const dogCmd: Command = {
    name: 'dog',
    description: {
        main: 'Ohhh... dasz mi karmę? Chcesz zobaczyć moją słodką mordkę? To ja, piesek.',
        short: 'Pokazuje losowego psa',
    },
    flags: CommandFlags.None,

    expectedArgs: [],

    aliases: ['kot'],

    permissions: {
        discordPerms: [],
        allowedRoles: null,
        allowedUsers: null
    },

    async execute(api) {
        api.msg.reply(await getGIF('parrot'));
    }
};

export const animalCmd: Command = {
    name: 'animal',
    description: {
        main: 'Chcesz do ZOO? Mamy ZOO w domu. ZOO w domu: [wpisz jakiego gifa chcesz]',
        short: 'Pokazuje losowego zwierza',
    },
    flags: CommandFlags.None,

    expectedArgs: [],

    aliases: ['zwierz', 'zwierzęcie'],
    permissions: {
        discordPerms: [],
        allowedRoles: null,
        allowedUsers: null
    },

    async execute(api) {
        const lmfao = ['parrot', 'dog', 'giraffe', 'elephant', 'cat'];
        api.msg.reply(await getGIF(lmfao[Math.floor(Math.random() * lmfao.length)]));
    }
};

export const parrotCmd: Command = {
    name: 'parrot',
    description: {
        main: 'Pokazuje losową papugę czy coś!',
        short: 'Pokazuje losową papugę!',
    },
    flags: CommandFlags.None,

    expectedArgs: [],

    aliases: [],
    permissions: {
        discordPerms: [],
        allowedRoles: null,
        allowedUsers: null
    },

    async execute(api) {
        api.msg.reply(await getGIF('parrot'));
    }
};
