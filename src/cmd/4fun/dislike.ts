import * as dsc from 'discord.js';
import * as log from '@/util/log.js';

import { Command } from "@/bot/command.js";

import { addRep, getLastRepGivenByUser, getUserReputationProportion, } from '@/bot/apis/rep/rep.js';
import { mkDualProgressBar } from '@/util/progressbar.js';

export const subRepCmd: Command = {
    name: 'dislike',
    aliases: ['-rep', 'subrep', 'sub-rep', 'repsub', 'rep-sub'],
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

        const lastRepGivenByUser = await getLastRepGivenByUser(api.msg.author.id);
        if (lastRepGivenByUser != null) {
            const createdAt = new Date(lastRepGivenByUser.createdAt);

            const now = new Date();
            const nextAvailable = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);

            if (now < nextAvailable) {
                return log.replyWarn(
                    api.msg, 'Halo!',
                    `Możesz oceniać użytkowników co 24h ale ten czas jeszcze nie miną! Będziesz mógł oceniać dopiero <t:${Math.floor(nextAvailable.getTime() / 1000)}:R>`
                );
            }
        }

        const oldRepProportion = await getUserReputationProportion(targetUser.id);
        await addRep(api.msg.author.id, targetUser.id, comment, '+rep');
        const newRepProportion = await getUserReputationProportion(targetUser.id);

        const embed = log.getSuccessEmbed(
            'Gotowe!', 'Dodałem wpis do bazy danych! Czy jest coś jeszcze co mogę dla ciebie zrobić? tak? to świetnie! i tak tego nie zrobie.'
        );

        if (newRepProportion.sub > oldRepProportion.sub) {
            embed
                .addFields(
                    {
                        name: `Zmniejszyłeś poziom reputacji <@${targetUser.id}> o ${newRepProportion.sub - oldRepProportion.sub} 👍`,
                        value: mkDualProgressBar(newRepProportion.sub, newRepProportion.plus),
                        inline: false,
                    }
                );
        }

        return api.msg.reply({ embeds: [embed] });
    },
};
