import { Command } from '../../bot/command';
import { cfg } from '../../bot/cfg';
import { db, sqlite } from '../../bot/db';

import * as log from '../../util/log';
import * as cfgManager from '../../bot/cfgManager';
import * as automod from '../../bot/automod';

import * as dsc from 'discord.js';
import { PredefinedColors } from '../../util/color';
import { likeInASentence } from '../../util/lias';

export const siemaCmd: Command = {
    name: 'siema',
    desc: 'Jakby to ująć... niespodzianka... Generalnie to taki jeden pan, nazywa się chlebek i serio jest chlebek, błagał 300000000 miliardów godzin, by to dodać, więc dodałem.',
    category: 'ogólne',
    expectedArgs: [],
    aliases: [],
    allowedRoles: null,
    allowedUsers: [],

    execute(msg, args, commands) {
        msg.reply({files: ['https://cdn.discordapp.com/attachments/1264971505662689311/1400225695455510739/togif-6.gif?ex=6899b50c&is=6898638c&hm=dbb63f75aea5879bbb38ae62c33f0feba80043cd79e23a4c25596e6f2275d1a0&']});
    },
};