import { Command } from '@/bot/command.ts';
import { CommandFlags } from '@/bot/apis/commands/misc.ts';
import { ReplyEmbed } from '../../bot/apis/translations/reply-embed.ts';
import { PredefinedColors } from '../../util/color.ts';

const pfpCmd: Command = {
    name: 'pfp',
    aliases: ['profilowe', 'avatar', 'awatar'],
    description: {
        main: "Któżby się spodziewał że komenda 'pfp' wyświetli czyjeś amazing profilowe?",
        short: 'Wyświetla czyjeś profilowe',
    },
    flags: CommandFlags.None,

    expectedArgs: [
        {
            name: 'user',
            description: 'Użytkownik generalnie...',
            optional: false,
            type: { base: 'user-mention' },
        },
    ],
    permissions: {
        allowedRoles: null,
        allowedUsers: null,
    },

    execute(api) {
        const user = api.getTypedArg('user', 'user-mention').value?.user ?? api.invoker.user;
        api.reply({ embeds: [
            new ReplyEmbed()
                .setImage(user.displayAvatarURL({ size: 1024 }))
                .setTitle("Proszę bardzo!")
                .setDescription("Tutaj jest amazing profilowe użytkownika " + user.displayName)
                .setColor(PredefinedColors.Cyan)
        ] });
    },
};

export default pfpCmd;
