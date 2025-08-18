import { Command } from '../../bot/command.js';
import { cfg } from '../../bot/cfg.js';
import { db, sqlite } from '../../bot/db.js';

import * as log from '../../util/log.js';
import * as cfgManager from '../../bot/cfgManager.js';
import * as automod from '../../bot/automod.js';

import * as dsc from 'discord.js';
import { PredefinedColors } from '../../util/color.js';
import { likeInASentence } from '../../util/lias.js';

export const pfpCmd: Command = {
    name: 'pfp',
    longDesc: 'Któżby się spodziewał że komenda \'pfp\' wyświetli czyjeś pfp?',
    shortDesc: 'Wyświetla czyjeś pfp',
    expectedArgs: [
        {
            name: 'user',
            desc: 'Użytkownik generalnie...'
        }
    ],
    aliases: ['profilowe', 'avatar', 'awatar'],
    allowedRoles: null,
    allowedUsers: [],

    execute(msg, args, commands) {
        const user = msg.mentions.members.first() || msg.member;
        msg.reply({content: 'Tu masz profilowe i nie marudź:', files: [user.displayAvatarURL()]});
    },
};