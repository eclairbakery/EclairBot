import { Command, Category } from '../../bot/command.js';
import { PredefinedColors } from '../../util/color.js';
import { cfg } from '../../bot/cfg.js';
import { db, sqlite } from '../../bot/db.js';

import * as log from '../../util/log.js';
import * as dsc from 'discord.js';

import findCommand from '../../util/findCommand.js';

export const manCmd: Command = {
    name: 'man',
    longDesc: 'Dokładniejsza dokumentacja, pokazująca użycie komend, czy możesz ich użyć oraz dokładny opis.',
    shortDesc: 'Dokładniejsza dokumentacja danej komendy',
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
        const manuals: Map<Category, Command[]> = new Map(
            [
                [
                    new Category('💔', 'inne', '', '', PredefinedColors.Pink),
                    [
                        {
                            name: 'woman',
                            longDesc: 'Kobieta. Po prostu kobieta. Ta komenda nie istnieje naprawdę, ale jest śmieszne, więc dodałem. Lubi się wkurzać o byle co. Mówi szyfrem (zrób mi herbatę = nie dbasz o mnie) i jest wymagana do urodzenia dziecka.',
                            shortDesc: '',
                            aliases: ['kobieta', 'żona', 'dziewczyna'],
                            expectedArgs: [
                                {
                                    name: 'odciąż mnie',
                                    desc: 'Wszystko muszę robić sama. Nie mam z wami żadnego pożytku',
                                },
                            ],
                            allowedRoles: [],
                            allowedUsers: [],
                            execute(msg, args, commands) {},
                        },
                    ]
                ],
                ...commands.entries()
            ]
        );

        if (args.length == 0) {
            return log.replyError(msg, 'Nie tędy droga...', 'No nie wiem jak ty, ale ja bym wolał, żeby man opisywał funkcje, które już znasz.\nDokładne logi błędu:\n```What manual page do you want?\nFor example, try \'man man\'.```');
        }
        const cmdName = args[0];

        const found = findCommand(cmdName, manuals);
        if (!found) {
            return log.replyError(msg, 'Nie tędy droga...', `Tak w ogóle, to wiesz, że nawet nie ma takiej komendy?\nDokładne logi błędu:\n\`\`\`No manual entry for  ${cmdName}\`\`\``);
        }
        const { command, category } = found;

        let formattedArgs: string[] = [];
        for (const arg of command.expectedArgs) {
            formattedArgs.push(`**${arg.name}**: ${arg.desc}`);
        }

        let formattedAllowedRoles: string[] = [];
        if (command.allowedRoles !== null) {
            for (const role of command.allowedRoles) {
                formattedAllowedRoles.push(`<@&${role}>`);
            }
        } else {
            formattedAllowedRoles.push('każda rola')
        }

        const emoji: string = ':diamond_shape_with_a_dot_inside:';

        const embed = new dsc.EmbedBuilder()
            .setTitle(':loudspeaker: Instrukcja')
            .setColor(category.color)
            .setDescription([
            `${emoji} **Wywołanie:** ${cfg.general.prefix}${command.name}`,
            `${emoji} **Aliasy do nazwy**: ${command.aliases.length === 0 ? 'brak aliasów' : command.aliases.join(', ')}`,
            `${emoji} **Opis**: ${command.longDesc}`,
            `${emoji} **Kategoria:** ${category.name} ${category.emoji}`,
            `${emoji} **Argumenty**: ${formattedArgs.length === 0 ? 'brak' : `\n> ${formattedArgs.join('\n> ')}`}`,
            `${emoji} **Uprawnienia**: ${
                command.allowedRoles != null && !msg.member.roles.cache.some((role) => command.allowedRoles.includes(role.id))
                ? ':thumbsdown: nie masz wymaganych uprawnień, by użyć tej komendy'
                : ':thumbsup: możesz użyć tej komendy'
            }; **dozwolone role**: ${formattedAllowedRoles.length === 0 ? 'brak' : formattedAllowedRoles.join(', ')}; **dozwoleni użytkownicy**: te ustawienie nie ma jeszcze efektu`
            ].join('\n'));

        msg.reply({ embeds: [embed] });
    },
};