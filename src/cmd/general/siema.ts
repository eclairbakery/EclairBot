import { Command, CommandFlags } from '@/bot/command.js';
import { cfg } from '@/bot/cfg.js';

import * as log from '@/util/log.js';
import * as dsc from 'discord.js';

import { PredefinedColors } from '@/util/color.js';
import capitalizeFirst from '@/util/capitalizeFirst.js';

export const siemaCmd: Command = {
    name: 'siema',
    description: {
        main: 'Jakby to ująć... niespodzianka... Generalnie to taki jeden pan, nazywa się chlebek i serio jest chlebek, błagał 300000000 miliardów godzin, by to dodać, więc dodałem.',
        short: 'Mała niespodzianka dla każdego!'
    },
    flags: CommandFlags.None | CommandFlags.WorksInDM,

    expectedArgs: [],
    aliases: [],
    permissions: {
        discordPerms: [],
        allowedRoles: null,
        allowedUsers: null
    },

    execute(api) {
        api.reply({files: ['https://raw.githubusercontent.com/gorciu-official/studio-online-content/refs/heads/main/togif.gif']});
    },
};
