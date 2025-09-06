import { Command, CommandArgumentWithUserMentionValue } from '../../bot/command.js';
import { cfg } from '../../bot/cfg.js';
import { db, sqlite } from '../../bot/db.js';

import * as log from '../../util/log.js';
import * as dsc from 'discord.js';

import { PredefinedColors } from '../../util/color.js';
import capitalizeFirst from '../../util/capitalizeFirst.js';

export const pfpCmd: Command = {
    name: 'pfp',
    description: {
        main: 'Któżby się spodziewał że komenda \'pfp\' wyświetli czyjeś pfp?',
        short: 'Wyświetla czyjeś pfp'
    },
    expectedArgs: [
        {
            name: 'user',
            description: 'Użytkownik generalnie...',
            optional: false,
            type: 'user-mention'
        }
    ],
    aliases: ['profilowe', 'avatar', 'awatar'],
    permissions: {
        discordPerms: [],
        allowedRoles: null,
        allowedUsers: null,
    },

    execute(api) {
        const user = (api.getTypedArg('user', 'user-mention') as CommandArgumentWithUserMentionValue).value?.user ?? api.msg.author.plainUser;
        api.msg.reply({content: 'Tu masz profilowe i nie marudź:', files: [user.displayAvatarURL()]});
    },
};