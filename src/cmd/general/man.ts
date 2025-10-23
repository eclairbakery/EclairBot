import { Command, CommandFlags } from '@/bot/command.js';
import { PredefinedColors } from '@/util/color.js';
import { cfg } from '@/bot/cfg.js';
import { db, sqlite } from '@/bot/db.js';

import * as log from '@/util/log.js';
import * as dsc from 'discord.js';

import findCommand from '@/util/findCommand.js';
import { Category } from '@/bot/command.js';

export const manCmd: Command = {
    name: 'man',
    description: {
        main: 'Dokładniejsza dokumentacja, pokazująca użycie komend, czy możesz ich użyć oraz dokładny opis.',
        short: 'Dokładniejsza dokumentacja danej komendy',
    },
    flags: CommandFlags.None,

    expectedArgs: [
        {
            name: 'command',
            description: 'Podaj tu bez prefixu komendę, o której chcesz się czegoś dowiedzieć...',
            optional: true,
            type: 'string'
        },
    ],
    aliases: [],
    permissions: {
        discordPerms: null,
        allowedRoles: null,
        allowedUsers: [],
    },

    async execute(api) {
        const manuals: Map<Category, Command[]> = new Map([
            [
                new Category('💔', 'inne', '', '', PredefinedColors.Pink),
                [
                    {
                        name: 'woman',
                        description: {
                            main: 'Kobieta. Po prostu kobieta. Ta komenda nie istnieje naprawdę, ale jest śmieszne, więc dodałem. Lubi się wkurzać o byle co. Mówi szyfrem (zrób mi herbatę = nie dbasz o mnie) i jest wymagana do urodzenia dziecka.',
                            short: ''
                        },
                        aliases: ['kobieta', 'żona', 'dziewczyna'],
                        flags: CommandFlags.None,
                        expectedArgs: [
                            {
                                name: 'odciąż mnie',
                                description: 'Wszystko muszę robić sama. Nie mam z wami żadnego pożytku',
                                optional: false,
                                type: 'string'
                            },
                        ],
                        permissions: {
                            allowedRoles: [],
                            allowedUsers: [],
                            discordPerms: []
                        },
                        execute() {},
                    },
                ],
            ],
            ...api.commands.entries(),
        ]);

        if (api.args.length === 0) {
            return log.replyError(
                api.msg,
                'Nie tędy droga...',
                'No nie wiem jak ty, ale ja bym wolał, żeby man opisywał funkcje, które już znasz.\nDokładne logi błędu:\n```What manual page do you want?\nFor example, try \'man man\'.```'
            );
        }

        const cmdName = api.args[0];
        const found = findCommand(cmdName.value as string ?? 'man', manuals);

        if (!found) {
            return log.replyError(
                api.msg,
                'Nie tędy droga...',
                `Tak w ogóle, to wiesz, że nawet nie ma takiej komendy?\nDokładne logi błędu:\n\`\`\`No manual entry for  ${cmdName}\`\`\``
            );
        }

        const { command, category } = found;

        const formattedArgs = command.expectedArgs.map((arg) => `**${arg.name}**: ${arg.description}`);

        const formattedAllowedRoles: string[] =
            command.permissions.allowedRoles !== null
                ? command.permissions.allowedRoles.map((role: string) => `<@&${role}>`)
                : ['każda rola'];

        const emoji: string = ':diamond_shape_with_a_dot_inside:';

        const embed = new dsc.EmbedBuilder()
            .setTitle(':loudspeaker: Instrukcja')
            .setColor(category.color)
            .setDescription(
                [
                    `${emoji} **Wywołanie:** ${cfg.general.prefix}${command.name}`,
                    `${emoji} **Aliasy do nazwy**: ${command.aliases.length === 0 ? 'brak aliasów' : command.aliases.join(', ')}`,
                    `${emoji} **Opis**: ${command.description.main}`,
                    `${emoji} **Krótki opis:** ${command.description.short}`,
                    `${emoji} **Kategoria:** ${category.name} ${category.emoji}`,
                    `${emoji} **Argumenty**: ${formattedArgs.length === 0 ? 'brak' : `\n> ${formattedArgs.join('\n> ')}`}`,
                    `${emoji} **Uprawnienia**: ${
                        command.permissions.allowedRoles != null &&
                        !api.msg.member!.plainMember.roles.cache.some((role: any) => command.permissions.allowedRoles!.includes(role.id))
                            ? ':thumbsdown: nie masz wymaganych uprawnień, by użyć tej komendy'
                            : ':thumbsup: możesz użyć tej komendy'
                    }; **dozwolone role**: ${formattedAllowedRoles.length === 0 ? 'brak' : formattedAllowedRoles.join(', ')}; **dozwoleni użytkownicy**: te ustawienie nie ma jeszcze efektu`,
                ].join('\n')
            );

        return api.msg.reply({ embeds: [embed] });
    },
};
