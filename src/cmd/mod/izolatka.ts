import { Command, CommandAPI, CommandFlags } from '@/bot/command.js';
import { cfg } from '@/bot/cfg.js';
import * as dsc from 'discord.js';
import * as log from '@/util/log.js';
import { PredefinedColors } from '@/util/color.js';

export const izolatkaCmd: Command = {
    name: 'izolatka',
    aliases: [],
    description: {
        main: 'Jakby to ująć tak poetycko... Zamknij kogoś w przybrzeżnym więzieniu.',
        short: 'Taki mute ale bardziej denerwujący. Aha, no i można z administracją gadać.'
    },
    flags: CommandFlags.Important,

    expectedArgs: [
        { name: 'question', type: 'string', optional: false, description: 'Mam go dodać do izolatki (add) czy go stamtąd usunąć (rem)?'},
        { name: 'user', type: 'user-mention', optional: false, description: 'Podaj użytkownika do izolatki!' }
    ],
    permissions: {
        discordPerms: null,
        allowedRoles: ['1274478730697510997', '1368301367655141446', '1280884378586845216', '1280081773019140096'],
        allowedUsers: []
    },
    async execute(api) {
        const targetUser = api.getTypedArg('user', 'user-mention').value as dsc.GuildMember;
        const mode = api.getTypedArg('question', 'string').value as string;
        if (mode !== 'add' && mode !== 'rem') {
            return log.replyError(api.msg, 'Podaj akcję.', 'Kolego, panie! Mam go dodać (add) czy usunąć (rem)?');
        }
        if (mode == 'add' && !targetUser.roles.cache.has('1415020555572088872')) {
            targetUser.roles.add('1415020555572088872');
        }
        if (mode == 'rem' && targetUser.roles.cache.has('1415020555572088872')) {
            targetUser.roles.remove('1415020555572088872');
        }

        return log.replySuccess(api.msg, 'TAAK!', 'Udało się przenieść / wywalić usera z izolatki!')
    }
};
