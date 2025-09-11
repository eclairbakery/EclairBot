import * as dsc from 'discord.js';
import * as log from '@/util/log.js';

import { Command } from "@/bot/command.js";

import { getUserReputation } from '@/bot/apis/rep/rep.js';

export const reputationCmd: Command = {
    name: 'reputation',
    aliases: [],
    description: {
        main: 'To polecenie wyświetla ci reputacje danego użytkownika oraz kilka najnowszych opinii!',
        short: 'Wyświetla reputacje użytkownika',
    },

    expectedArgs: [
        {
            name: 'user',
            description: 'Użytkownik którego reputacje chcesz sprawdzić',
            type: 'user-mention-or-reference-msg-author',
            optional: false,
        },
    ],
    permissions: {
        allowedRoles: null,
        allowedUsers: null,
        discordPerms: null,
    },

    async execute(api) {
        const user = api.getTypedArg('user', 'user-mention-or-reference-msg-author').value as dsc.GuildMember;
        return log.replySuccess(api.msg, 'Wynik', (await getUserReputation(user.user.id)).toString());
    },
};
