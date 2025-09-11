import * as dsc from 'discord.js';
import * as log from '@/util/log.js';

import { Command } from "@/bot/command.js";

import { setRep, cannotVote } from '@/bot/apis/rep/rep.js';

export const subRepCmd: Command = {
    name: '-rep',
    aliases: ['subrep', 'sub-rep', 'repsub', 'rep-sub', 'dislike'],
    description: {
        main: 'Tym poleceniem możesz pokazać danej osobie że jej nie lubisz, jest wkurwiająca, lub uprzykrza życie innym, odejmując jej punkty reputacji!',
        short: 'Dodaje punkty reputacji danej osobie',
    },

    expectedArgs: [
        {
            name: 'user',
            description: 'Tu podaj użytkownika ok',
            type: 'user-mention-or-reference-msg-author',
            optional: false,
        },
        {
            name: 'comment',
            description: 'Tu możesz dać komentarz, dlaczego chcesz zmniejszyć reputacje danej osobie!',
            type: 'trailing-string',
            optional: true,
        }
    ],
    permissions: {
        allowedUsers: null,
        allowedRoles: null,
        discordPerms: null,
    },

    async execute(api) {
        const targetUser = api.getTypedArg('user', 'user-mention-or-reference-msg-author').value as dsc.GuildMember;
        const comment = api.getTypedArg('comment', 'trailing-string').value as string | null;

        if (api.msg.author.id == targetUser.id) {
            return log.replyWarn(api.msg, 'Halo!', 'Nie mozesz modyfikować swoich punktów reputacji!');
        }

        if (cannotVote.get(api.msg.author.id) == true) {
            return log.replyWarn(api.msg, 'Halo!', 'Ostatnio głosowałeś! Odczekaj chwilę');
        }
        
        cannotVote.set(api.msg.author.id, true);
        
        setTimeout(() => {
            cannotVote.set(api.msg.author.id, false);
        }, 1000 * 60 * 60 * 2)

        await setRep(api.msg.author.id, targetUser.id, comment, '-rep');

        return log.replySuccess(api.msg, 'Gotowe!',
            'Dodałem wpis do bazy danych! Czy jest coś jeszcze co mogę dla ciebie zrobić? tak? to świetnie! i tak tego nie zrobie.');
    },
};
