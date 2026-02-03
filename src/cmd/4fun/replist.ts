import * as dsc from 'discord.js';
import * as log from '@/util/log.js';
import util from 'node:util';

import { Command, CommandFlags } from "@/bot/command.js";

import { mkDualProgressBar, mkProgressBar } from '@/util/progressbar.js';
import { PredefinedColors } from '@/util/color.js';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.js';
import User from '@/bot/apis/db/user.js';

const DefaultLimit = 10;

export const replistCmd: Command = {
    name: 'replist',
    aliases: ['list-reps', 'repslist', 'rep-list'],
    description: {
        main: 'Pokazuje liste wystawionych opini o danym użytkowniku',
        short: 'Wyświetla opinie użytkownika',
    },
    flags: CommandFlags.None,

    expectedArgs: [
        {
            name: 'user',
            description: 'Użytkownik którego repów chcesz dostać liste',
            type: 'user-mention-or-reference-msg-author',
            optional: false,
        },
        {
            name: 'limit',
            description: `Limit ile maksymalnie repów chcesz zobaczyć. Domyślnie ${DefaultLimit}`,
            type: 'number',
            optional: true,
        }
    ],
    permissions: {
        allowedUsers: null,
        allowedRoles: null,
    },

    async execute(api) {
        const user = api.getTypedArg('user', 'user-mention-or-reference-msg-author').value as dsc.GuildMember;
        const limit = api.getTypedArg('limit', 'number').value as number | null ?? DefaultLimit;

        const userReps = await new User(user.id).reputation.getReceived();

        let fields: dsc.APIEmbedField[] = [];
        let i = 1;

        for (const rep of userReps) {
            if (i > limit) break;

            const author = await api.guild?.members.fetch(rep.authorId);
            if (author == null) continue;

            fields.push({
                name: `${rep.type == '+rep' ? '🟢' : '🔴'} ${rep.type} od ${author.user.displayName}`,
                value: rep.comment ?? '*Brak komentarza*',
                inline: false,
            });

            ++i;
        }
        if (userReps.length - i + 1 > 0) {
            fields.push({
                name: `I jeszcze ${userReps.length + 1 - i}...`,
                value: '',
                inline: false,
            });
        }

        return api.reply({
            embeds: [
                new ReplyEmbed()
                    .setTitle(`Lista opini użytkownika ${api.invoker.member?.displayName ?? api.invoker.user.username}`)
                    .setDescription('No ten, tu masz liste:')
                    .setFields(fields)
                    .setColor(PredefinedColors.Cyan)
            ]
        });
    },
};
