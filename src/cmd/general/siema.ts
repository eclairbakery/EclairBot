import { Command } from '../../bot/command.js';
import { cfg } from '../../bot/cfg.js';
import { db, sqlite } from '../../bot/db.js';

import * as log from '../../util/log.js';
import * as cfgManager from '../../bot/cfgManager.js';
import * as automod from '../../bot/automod.js';

import * as dsc from 'discord.js';
import { PredefinedColors } from '../../util/color.js';
import capitalizeFirst from '../../util/capitalizeFirst.js';

export const siemaCmd: Command = {
    name: 'siema',
    longDesc: 'Jakby to ująć... niespodzianka... Generalnie to taki jeden pan, nazywa się chlebek i serio jest chlebek, błagał 300000000 miliardów godzin, by to dodać, więc dodałem.',
    shortDesc: 'Jakby to ująć... niespodzianka... ',
    expectedArgs: [],
    aliases: [],
    allowedRoles: null,
    allowedUsers: [],

    execute(msg, args, commands) {
        msg.reply({files: ['https://raw.githubusercontent.com/gorciu-official/studio-online-content/refs/heads/main/togif.gif']});
    },
};