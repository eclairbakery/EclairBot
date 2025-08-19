import { Command, Category } from '../../bot/command.js';
import { cfg } from '../../bot/cfg.js';
import { db, sqlite } from '../../bot/db.js';

import * as log from '../../util/log.js';
import * as cfgManager from '../../bot/cfgManager.js';
import * as automod from '../../bot/automod.js';

import * as dsc from 'discord.js';
import { PredefinedColors } from '../../util/color.js';
import capitalizeFirst from '../../util/capitalizeFirst.js';

export const bannerCmd: Command = {
    name: 'banner',
    longDesc: 'Dobra... Wyświetle Ci jełopa baner jak chcesz.',
    shortDesc: 'Wyświetla baner danego użytkownika',
    expectedArgs: [
        {
            name: 'user',
            desc: 'Użytkownik generalnie...'
        }
    ],
    aliases: ['baner'],
    allowedRoles: null,
    allowedUsers: [],

    async execute(msg, args, commands) {
        const member = msg.mentions.members.first() || msg.member;
        const user = member.user;

        const fetchedUser = await user.fetch();

        const bannerURL = fetchedUser.bannerURL({ size: 1024, extension: 'png' });
        const accentColor = fetchedUser.accentColor;

        if (!bannerURL && !accentColor) {
            return msg.reply({ content: 'Ten użytkownik nie ma ustawionego banera ani koloru baneru.' });
        }

        if (bannerURL) msg.reply({
            content: 'Proszę, oto baner:',
            files: [bannerURL]
        });
        else msg.reply({
            content: `Kolor akcentu (baneru): #${accentColor.toString(16).padStart(6, '0')}`
        })
    },
};