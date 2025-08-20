import { Command } from '../../bot/command.js';
import { cfg } from '../../bot/cfg.js'
import { db, sqlite } from '../../bot/db.js';

import * as log from '../../util/log.js';
import * as cfgManager from '../../bot/cfgManager.js';

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
    longDesc: 'Lubisz koty? Jakże pięknie się składa. Możemy Ci pokazać losowego kota.',
    shortDesc: 'Pokazuje losowego kota',
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
    longDesc: 'Ohhh... dasz mi karmę? Chcesz zobaczyć moją słodką mordkę? To ja, piesek.',
    shortDesc: 'Pokazuje losowego psa',
    expectedArgs: [],

    aliases: ['pies'],
    allowedRoles: null,
    allowedUsers: [],

    async execute(msg, args) {
        msg.reply(await getGIF('dog'));
    }
};

export const parrotCmd: Command = {
    name: 'parrot',
    longDesc: 'Gru... bierzesz coś? Bierze bierze Hepaslimin. Daj spokój papuga.',
    shortDesc: 'Pokazuje losową papugę',
    expectedArgs: [],

    aliases: ['papuga'],
    allowedRoles: null,
    allowedUsers: [],

    async execute(msg, args) {
        msg.reply(await getGIF('parrot'));
    }
};

export const animalCmd: Command = {
    name: 'animal',
    longDesc: 'Chcesz do ZOO? Mamy ZOO w domu. ZOO w domu: [wpisz jakiego gifa chcesz]',
    shortDesc: 'Pokazuje losowego zwierza',
    expectedArgs: [],

    aliases: ['zwierz', 'zwierzęcie'],
    allowedRoles: null,
    allowedUsers: [],

    async execute(msg, args) {
        const lmfao = ['parrot', 'dog', 'giraffe', 'elephant', 'cat'];
        msg.reply(await getGIF(lmfao[Math.floor(Math.random() * lmfao.length)]));
    }
};