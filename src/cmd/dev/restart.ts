import { Command } from '../../bot/command.js';
import { cfg } from '../../bot/cfg.js'
import { db, sqlite } from '../../bot/db.js';

import * as log from '../../util/log.js';
import * as dsc from 'discord.js';

import { PredefinedColors } from '../../util/color.js';

let canRestart = false;

setTimeout(() => {
    canRestart = true;
}, 61 * 1000);

export const restartCmd: Command = {
    name: 'restart',
    longDesc: 'Restartuje bota... Nie tykaj!',
    shortDesc: 'Szybki restart bota!',
    expectedArgs: [],

    aliases: [],
    allowedRoles: null,
    allowedUsers: [],

    async execute(msg, args) {
        if (msg.author.id !== '990959984005222410') {
            return msg.reply('nuh uh');
        }
        if (!canRestart) {
            return msg.reply('operacja unsafe w tym momencie');
        }
        console.log('Issued restart. This will work due to the behaviour of Pterodactyl Daemon.');
        await msg.reply('jusz siem restartujem plis łejt plis plis plis łejt');
        process.exit(1);
    }
}