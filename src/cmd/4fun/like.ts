import * as dsc from 'discord.js';
import * as log from '@/util/log.ts';

import { Command } from '@/bot/command.ts';
import { CommandFlags } from '@/bot/apis/commands/misc.ts';

import { getLastRepGivenByUser, getUserReputationProportion } from '@/bot/apis/rep/rep.ts';
import { mkDualProgressBar } from '@/util/progressbar.ts';

const plusRepCmd: Command = {
    name: 'like',
    aliases: ['+rep', 'addrep', 'add-rep', 'repadd', 'rep-add'],
    description: {
        main: 'Tym poleceniem możesz pokazać danej osobie że ją lubisz, że jest inspirująca lub... kurde skończyły mi się słowa. Ale ogólnie dodaje punkty reputacji!',
        short: 'Dodaje punkty reputacji danej osobie',
    },
    flags: CommandFlags.None,

    expectedArgs: [
        {
            name: 'user',
            description: 'Tu podaj użytkownika ok',
            type: { base: 'user-mention', includeRefMessageAuthor: true },
            optional: false,
        },
        {
            name: 'comment',
            description: 'Tu możesz dać komentarz, dlaczego chcesz dodać reputacje danej osobie!',
            type: { base: 'string', trailing: true },
            optional: true,
        },
    ],
    permissions: {
        allowedUsers: null,
        allowedRoles: null,
    },

    async execute(api) {
        const targetUser = api.getTypedArg('user', 'user-mention').value as dsc.GuildMember;
        const comment = api.getTypedArg('comment', 'string')?.value;

        if (api.invoker.id == targetUser.id) {
            return api.log.replyWarn(api, 'Halo!', 'Nie mozesz modyfikować swoich punktów reputacji!');
        }

        const lastRepGivenByUser = await getLastRepGivenByUser(api.invoker.id);
        if (lastRepGivenByUser != null) {
            const createdAt = new Date(lastRepGivenByUser.createdAt);

            const now = new Date();
            const nextAvailable = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);

            if (now < nextAvailable) {
                return api.log.replyWarn(
                    api,
                    'Halo!',
                    `Możesz oceniać użytkowników co 24h ale ten czas jeszcze nie miną! Będziesz mógł oceniać dopiero <t:${Math.floor(nextAvailable.getTime() / 1000)}:R>`,
                );
            }
        }

        const oldRepProportion = await getUserReputationProportion(targetUser.id);
        await api.executor.reputation.give(targetUser.id, '+rep', comment);
        const newRepProportion = await getUserReputationProportion(targetUser.id);

        if (!api.preferShortenedEmbeds) {
            const embed = log.getSuccessEmbed(
                'Gotowe!',
                'Dodałem wpis do bazy danych! Czy jest coś jeszcze co mogę dla ciebie zrobić? tak? to świetnie! i tak tego nie zrobie.',
            );

            if (newRepProportion.plus > oldRepProportion.plus) {
                embed
                    .addFields(
                        {
                            name: `Podwyższyłeś poziom reputacji ${targetUser.displayName} o ${newRepProportion.plus - oldRepProportion.plus} 👍`,
                            value: mkDualProgressBar(newRepProportion.sub, newRepProportion.plus),
                            inline: false,
                        },
                    );
            }

            return api.reply({ embeds: [embed] });
        } else {
            log.replySuccess(api, 'Polubiłeś tego uzytkownika!', 'To w sumie tyle. Chyba sprawisz mu radość (nie).');
        }
    },
};

export default plusRepCmd;
