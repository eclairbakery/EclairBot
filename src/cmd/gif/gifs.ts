import { Command } from '../../bot/command.js';
import { cfg } from '../../bot/cfg.js'
import { db, sqlite } from '../../bot/db.js';

import * as log from '../../util/log.js';
import * as cfgManager from '../../bot/cfgManager.js';
import * as automod from '../../bot/automod.js';

import * as dsc from 'discord.js';
import { PredefinedColors } from '../../util/color.js';
import { dbGet } from '../../bot/shared.js';

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
    desc: 'Lubisz koty? Jakże pięknie się składa. Możemy Ci pokazać losowego kota.',
    category: 'gify',
    expectedArgs: [],

    aliases: ['kot'],
    allowedRoles: null,
    allowedUsers: [],

    async execute(msg, args) {
        msg.reply(await getGIF('cat'));
    }
};

export const dogCmd: Command = {
    name: 'dog',
    desc: 'Ohhh... dasz mi karmę? Chcesz zobaczyć moją słodką mordkę? To ja, piesek.',
    category: 'gify',
    expectedArgs: [],

    aliases: ['pies'],
    allowedRoles: null,
    allowedUsers: [], 

    async execute(msg, args) {
        msg.reply(await getGIF('dog'));
    }
};