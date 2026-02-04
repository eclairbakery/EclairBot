import { Command, CommandArgumentWithUserMentionValue, CommandFlags } from '@/bot/command.js';

export const pfpCmd: Command = {
    name: 'pfp',
    aliases: ['profilowe', 'avatar', 'awatar'],
    description: {
        main: 'Któżby się spodziewał że komenda \'pfp\' wyświetli czyjeś pfp?',
        short: 'Wyświetla czyjeś pfp'
    },
    flags: CommandFlags.None,

    expectedArgs: [
        {
            name: 'user',
            description: 'Użytkownik generalnie...',
            optional: false,
            type: 'user-mention'
        }
    ],
    permissions: {
        allowedRoles: null,
        allowedUsers: null,
    },

    execute(api) {
        const user = (api.getTypedArg('user', 'user-mention') as CommandArgumentWithUserMentionValue).value?.user ?? api.invoker.user;
        api.reply({content: 'Tu masz profilowe i nie marudź:', files: [user.displayAvatarURL()]});
    },
};
