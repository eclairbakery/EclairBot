import { Command } from '../../bot/command';
import { cfg } from '../../bot/cfg';
import { db, sqlite } from '../../bot/db';

import * as log from '../../util/log';
import * as cfgManager from '../../bot/cfgManager';
import * as automod from '../../bot/automod';

import * as dsc from 'discord.js';
import { PredefinedColors } from '../../util/color';
import { likeInASentence } from '../../util/lias';

export const manCmd: Command = {
    name: 'man',
    desc: 'Dokładniejsza dokumentacja, pokazująca użycie komend, czy możesz ich użyć oraz dokładny opis.',
    category: 'ogólne',
    expectedArgs: [
        {
            name: 'command',
            desc: 'Podaj tu bez prefixu komendę, o której chcesz się czegoś dowiedzieć...'
        }
    ],
    aliases: [],
    allowedRoles: null,
    allowedUsers: [],

    async execute(msg, args, commands) {
        if (args.length == 0) {
            return log.replyError(msg, 'Nie tędy droga...', 'No nie wiem jak ty, ale ja bym wolał, żeby man opisywał funkcje, które już znasz.\nDokładne logi błędu:\n```What manual page do you want?\nFor example, try \'man man\'.```');
        }
        const cmd_name = args[0];
        const woman: Command = {name: 'woman', desc: 'Kobieta. Po prostu kobieta. Ta komenda nie istnieje naprawdę, ale jest śmieszne, więc dodałem. Lubi się wkurzać o byle co. Mówi szyfrem (zrób mi herbatę = nie dbasz o mnie) i jest wymagana do urodzenia dziecka.',execute(msg, args, commands){},aliases:['kobieta', 'żona', 'dziewczyna'],expectedArgs:[{name: 'odciąż mnie', desc: 'Wszystko muszę robić sama. Nie mam z wami żadnego pożytku'}],allowedRoles:[],allowedUsers:[],category:'kto wie'};
        const command = cmd_name === 'woman' ? woman : commands.find((cmd) => cmd.name === cmd_name || cmd.aliases.includes(cmd_name));
        if (!command) {
            return log.replyError(msg, 'Nie tędy droga...', `Tak w ogóle, to wiesz, że nawet nie ma takiej komendy?\nDokładne logi błędu:\n\`\`\`No manual entry for  ${cmd_name}\`\`\``);
        }
        let args_cmd: string[] = [];
        for (const arg of command.expectedArgs) {
            args_cmd.push(`**${arg.name}**: ${arg.desc}`);
        }
        let allowed_roles: string[] = [];
        if (command.allowedRoles !== null) {
            for (const ar of command.allowedRoles) {
                allowed_roles.push(`<@&${ar}>`);
            }
        } else {
            allowed_roles.push('każda rola')
        }
        msg.reply({
            embeds: [
                new dsc.EmbedBuilder()
                    .setTitle(':loudspeaker: Instrukcja')
                    .setColor(PredefinedColors.Purple)
                    .setDescription(`:diamond_shape_with_a_dot_inside: **Wywołanie:** ${cfg.general.prefix}${command.name}\n:diamond_shape_with_a_dot_inside: **Aliasy do nazwy**: ${command.aliases.length === 0 ? 'brak aliasów' : command.aliases.join(', ')}\n:diamond_shape_with_a_dot_inside: **Opis**: ${command.desc}\n:diamond_shape_with_a_dot_inside: **Kategoria:** ${command.category}\n:diamond_shape_with_a_dot_inside: **Argumenty**: ${args_cmd.length == 0 ? 'brak' : `\n> ${args_cmd.join('\n> ')}`}\n:diamond_shape_with_a_dot_inside: **Uprawnienia**: ${(command.allowedRoles != null && !msg.member.roles.cache.some((role) => command.allowedRoles.includes(role.id))) ? ':thumbsdown: nie masz wymaganych uprawnień, by użyć tej komendy' : ':thumbsup: możesz użyć tej komendy'}; **dozwolone role**: ${allowed_roles.length == 0 ? 'brak' : `${allowed_roles.join(', ')}`}; **dozwoleni użytkownicy**: te ustawienie nie ma jeszcze efektu`)
            ]
        })
    },
};