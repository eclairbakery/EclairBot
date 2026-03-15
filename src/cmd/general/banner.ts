import { Command } from '@/bot/command.ts';
import { CommandFlags } from '@/bot/apis/commands/misc.ts';

import * as dsc from 'discord.js';

import { Buffer } from 'node:buffer';

export const bannerCmd: Command = {
    name: 'banner',
    description: {
        main: 'Dobra... Wyświetle Ci jełopa baner jak chcesz.',
        short: 'Wyświetla baner danego użytkownika',
    },
    flags: CommandFlags.None | CommandFlags.WorksInDM,

    expectedArgs: [
        {
            name: 'user',
            description: 'Użytkownik generalnie...',
            type: { base: 'user-mention' },
            optional: true,
        },
    ],
    aliases: ['baner'],
    permissions: {
        allowedRoles: null,
        allowedUsers: null,
    },

    async execute(api) {
        const member = api.getTypedArg('user', 'user-mention').value;
        const target = member?.user ?? api.invoker.user;

        const fetchedUser = await target.fetch();

        const bannerURL = fetchedUser.bannerURL({ size: 1024, extension: 'png' });
        const accentColor = fetchedUser.accentColor;

        if (bannerURL == null && accentColor == null) {
            return api.reply({ content: 'Ten użytkownik nie ma ustawionego banera ani koloru baneru.' });
        }

        if (bannerURL != null) {
            api.reply({
                content: 'Proszę, oto baner:',
                files: [bannerURL],
            });
        } else if (accentColor != null) {
            const colorHex = accentColor.toString(16).padStart(6, '0');
            const imageUrl = `https://singlecolorimage.com/get/${colorHex}/700x150.png`;
            const response = await fetch(imageUrl);
            const buffer = Buffer.from(await response.arrayBuffer());
            const attachment = new dsc.AttachmentBuilder(buffer, { name: 'color.png' });

            api.reply({
                content: `Proszę, oto baner: (stały kolor, #${colorHex})`,
                files: [attachment],
            });
        }
    },
};
