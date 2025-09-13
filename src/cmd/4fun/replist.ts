import * as dsc from 'discord.js';
import * as log from '@/util/log.js';
import util from 'util';

import { Command } from "@/bot/command.js";

import { getUserReps, getUserReputation, Reputation } from '@/bot/apis/rep/rep.js';
import { mkDualProgressBar, mkProgressBar } from '@/util/progressbar.js';
import { PredefinedColors } from '@/util/color.js';

const DefaultLimit = 10;

export const replistCmd: Command = {
    name: 'replist',
    aliases: ['list-reps', 'repslist', 'rep-list'],
    description: {
        main: 'Pokazuje liste wystawionych opini o danym użytkowniku',
        short: 'Wyświetla opinie użytkownika',
    },

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
        discordPerms: null,
    },

    async execute(api) {
        const user = api.getTypedArg('user', 'user-mention-or-reference-msg-author').value as dsc.GuildMember;
        const limit = api.getTypedArg('limit', 'number').value as number | null ?? DefaultLimit;

        const userReps = await getUserReps(user.id);

        let fields: dsc.APIEmbedField[] = [];
        let i = 1;

        for (const rep of userReps) {
            if (i > limit) break;

            const author = await api.msg.guild?.members.fetch(rep.authorID);
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

        return api.msg.reply({
            embeds: [
                new dsc.EmbedBuilder()
                    .setTitle(`Lista opini użytkownika ${api.msg.member?.plainMember.displayName ?? api.msg.author.plainUser.username}`)
                    .setDescription('No ten, tu masz liste:')
                    .setFields(fields)
                    .setColor(PredefinedColors.Cyan)
            ]
        });
    },
};
