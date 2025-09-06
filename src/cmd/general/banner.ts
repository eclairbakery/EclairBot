import { Command, CommandArgumentWithUserMentionValue } from '../../bot/command.js';
import { cfg } from '../../bot/cfg.js';
import { db, sqlite } from '../../bot/db.js';

import * as log from '../../util/log.js';
import * as dsc from 'discord.js';

import { PredefinedColors } from '../../util/color.js';
import capitalizeFirst from '../../util/capitalizeFirst.js';

export const bannerCmd: Command = {
    name: 'banner',
    description: {
        main: 'Dobra... Wyświetle Ci jełopa baner jak chcesz.',
        short: 'Wyświetla baner danego użytkownika'
    },
    expectedArgs: [
        {
            name: 'user',
            description: 'Użytkownik generalnie...',
            type: 'user-mention',
            optional: true
        }
    ],
    aliases: ['baner'],
    permissions: {
        discordPerms: null,
        allowedRoles: null,
        allowedUsers: null
    },

    async execute(api) {
        const member = api.getTypedArg('user', 'user-mention') as CommandArgumentWithUserMentionValue;
        const user = member.value?.user ?? api.msg.author.plainUser;

        const fetchedUser = await user.fetch();

        const bannerURL = fetchedUser.bannerURL({ size: 1024, extension: 'png' });
        const accentColor = fetchedUser.accentColor;

        if (!bannerURL && !accentColor) {
            return api.msg.reply({ content: 'Ten użytkownik nie ma ustawionego banera ani koloru baneru.' });
        }

        if (bannerURL) api.msg.reply({
            content: 'Proszę, oto baner:',
            files: [bannerURL]
        });
        else api.msg.reply({
            content: `Proszę, oto baner: (stały kolor, #${accentColor.toString(16).padStart(6, '0')})`,
            files: [new dsc.AttachmentBuilder(Buffer.from(await (await fetch(`https://singlecolorimage.com/get/${accentColor.toString(16).padStart(6, '0')}/700x150.png`)).arrayBuffer()), { name: "color.png" })]
        })
    },
};