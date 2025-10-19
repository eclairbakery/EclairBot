import * as dsc from 'discord.js';
import * as log from '@/util/log.js';
import util from 'node:util';

import { Command, CommandFlags } from "@/bot/command.js";

import { getUserReputation, Reputation } from '@/bot/apis/rep/rep.js';
import { mkDualProgressBar, mkProgressBar } from '@/util/progressbar.js';
import { getTopRep } from '@/bot/apis/rep/top.js';
import { PredefinedColors } from '@/util/color.js';

const DefaultCount = 6;

export const toprepCmd: Command = {
    name: 'toprep',
    aliases: ['reptop', 'reputationtop', 'reputation-top', 'topreputation', 'top-reputation'],
    description: {
        main: 'Ogólnie to polecenie wyświetla topke reputacji',
        short: 'Wyświetla topke reputacji',
    },
    flags: CommandFlags.None,

    expectedArgs: [
        {
            name: 'count',
            description: `Tu ogólnie możesz podać ile miejsc w topce. Domyślnie to ${DefaultCount}.`,
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
        const count = api.getTypedArg('count', 'number').value as number | null ?? DefaultCount;

        if (count > 18) {
            return log.replyError(api.msg, 'Ej nie przesadzaj!', 'Nie pozwole ci więcej niż 18 pól bo zrobi się flood!');
        }

        const top = await getTopRep(50);

        let fields: dsc.APIEmbedField[] = [];
        let i = 1;

        for (const [userID, repScale] of top) {
            if (i > count) break;

            const user = await api.msg.guild?.members.fetch(userID).catch(() => null);
            if (user == null) continue;

            const rep = await getUserReputation(userID);

            fields.push({
                name: `${i} » ${user.user.username}`,
                value: `**Reputacja:** ${Math.floor(repScale)}/10\n\`${mkProgressBar(repScale, 10, 20)}\`\n${mkDualProgressBar(rep.repProportion.sub ?? 0, rep.repProportion.plus ?? 0)}`,
                inline: true,
            });

            ++i;
        }

        return api.msg.reply({
            embeds: [
                new dsc.EmbedBuilder()
                    .setColor(PredefinedColors.Cyan)
                    .setDescription('-# eklerka dalej nie zrobił obrazka na top reputacji'),
                new dsc.EmbedBuilder()
                    .setColor(PredefinedColors.Cyan)
                    .setFields(fields)
            ]
        });
    },
};
