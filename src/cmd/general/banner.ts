import { Command } from '@/bot/command.ts';
import { CommandFlags } from '@/bot/apis/commands/misc.ts';

import { ReplyEmbed } from '../../bot/apis/translations/reply-embed.ts';
import { PredefinedColors } from '../../util/color.ts';

const bannerCmd: Command = {
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
                embeds: [
                    new ReplyEmbed()
                        .setTitle('Oto baner')
                        .setDescription(`Ten użytkownik ma chyba Nitro i obrazek customowy.`)
                        .setImage(bannerURL)
                        .setColor(PredefinedColors.Pink),
                ],
            });
        } else if (accentColor != null) {
            const colorHex = accentColor.toString(16).padStart(6, '0');
            const imageUrl = `https://singlecolorimage.com/get/${colorHex}/700x150.png`;

            api.reply({
                embeds: [
                    new ReplyEmbed()
                        .setTitle('Oto baner')
                        .setDescription(`Stały kolor #${colorHex}`)
                        .setImage(imageUrl)
                        .setColor(PredefinedColors.Pink),
                ],
            });
        }
    },
};

export default bannerCmd;
