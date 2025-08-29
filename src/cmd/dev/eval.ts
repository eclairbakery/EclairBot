import { Command } from '../../bot/command.js';
import { cfg } from '../../bot/cfg.js'
import { db, sqlite } from '../../bot/db.js';

import * as log from '../../util/log.js';
import * as dsc from 'discord.js';

import { PredefinedColors } from '../../util/color.js';

export const evalCmd: Command = {
    name: 'eval',
    longDesc: 'Wykonuje kod JavaScript. Jest naprawdę potencjalnie unsafe, dlatego to jest locknięte do granic możliwości.',
    shortDesc: 'Wykonuje kod JavaScript, więc jest bardzo unsafe.',
    expectedArgs: [],

    aliases: [],
    allowedRoles: null,
    allowedUsers: [],

    async execute(msg, args) {
        if (msg.author.id !== '990959984005222410') {
            return msg.reply('nuh uh');
        }
        msg.reply(`wynik twojej super komendy:\n\`\`\`${(0, eval)(args.join(' '))}\`\`\``) // eval command
    }
}