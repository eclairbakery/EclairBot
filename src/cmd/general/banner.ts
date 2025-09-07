import { Command, CommandArgumentWithUserMentionValue } from '@/bot/command.js';
import { cfg } from '@/bot/cfg.js';
import { db, sqlite } from '@/bot/db.js';

import * as log from '@/util/log.js';
import * as dsc from 'discord.js';

import { PredefinedColors } from '@/util/color.js';
import capitalizeFirst from '@/util/capitalizeFirst.js';

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

        if (bannerURL == null && accentColor == null) {
            return api.msg.reply({ content: 'Ten użytkownik nie ma ustawionego banera ani koloru baneru.' });
        }

        if (bannerURL != null) {
            api.msg.reply({
                content: 'Proszę, oto baner:',
                files: [bannerURL]
            });
        } else if (accentColor != null) {
            const colorHex = accentColor.toString(16).padStart(6, '0');
            const imageUrl = `https://singlecolorimage.com/get/${colorHex}/700x150.png`;
            const response = await fetch(imageUrl);
            const buffer = Buffer.from(await response.arrayBuffer());
            const attachment = new dsc.AttachmentBuilder(buffer, { name: "color.png" });

            api.msg.reply({
                content: `Proszę, oto baner: (stały kolor, #${colorHex})`,
                files: [attachment]
            });
        }
    },
};