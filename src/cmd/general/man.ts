import { Command, CommandFlags } from '@/bot/command.js';
import { PredefinedColors } from '@/util/color.js';
import { cfg } from '@/bot/cfg.js';
import { db, sqlite } from '@/bot/db.js';

import * as log from '@/util/log.js';
import * as dsc from 'discord.js';

import findCommand from '@/util/cmd/findCommand.js';
import { Category } from '@/bot/command.js';
import { findCmdConfResolvable } from '@/util/cmd/findCmdConfigObj.js';
import fmtEmoji from '@/util/fmtEmoji.js';

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
                            short: 'No kobieta bratku.'
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

        const cmdName = api.getTypedArg('command', 'string')?.value;

        if (!cmdName) {
            return api.log.replyError(
                api.msg,
                'Nie tędy droga...',
                'No nie wiem jak ty, ale ja bym wolał, żeby man opisywał funkcje, które już znasz.\nDokładne logi błędu:\n```What manual page do you want?\nFor example, try \'man man\'.```'
            );
        }

        const found = findCommand(cmdName ?? 'man', manuals);

        if (!found) {
            return api.log.replyError(
                api.msg,
                'Nie tędy droga...',
                `Tak w ogóle, to wiesz, że nawet nie ma takiej komendy?\nDokładne logi błędu:\n\`\`\`No manual entry for ${cmdName}\`\`\``
            );
        }

        const { command, category } = found;

        if (!findCmdConfResolvable(command.name).enabled) {
            return api.log.replyWarn(api.msg, 'Ta komenda jest wyłączona.', "Nie dowiesz się o niej nic, dopóki nie zostanie włączona.");
        }

        const formattedArgs = command.expectedArgs.map((arg) => `**${arg.name}**: ${arg.description}`);

        const formattedAllowedRoles: string[] =
            command.permissions.allowedRoles !== null
                ? command.permissions.allowedRoles.map((role: string) => `<@&${role}>`)
                : ['każda rola'];

        const formattedAllowedUsers: string[] =
            command.permissions.allowedUsers !== null
                ? command.permissions.allowedUsers.map((user: string) => `<@${user}>`)
                : ['każdy użytkownik'];

        const emoji: string = fmtEmoji({
            name: 'emoji_kropa',
            id: '1430647658736914622'
        });

        const canUseCommand =
        command.permissions.allowedRoles != null &&
        api.msg.member?.plainMember &&
        api.msg.member?.plainMember.roles &&
        api.msg.member?.plainMember.roles.cache.some((role: any) =>
            command.permissions.allowedRoles!.includes(role.id)
        );

        const embed = new dsc.EmbedBuilder()
            .setTitle(':loudspeaker: Instrukcja')
            .setColor(category.color)
            .setDescription(
                [
                    `${emoji} **Wywołanie:** ${cfg.general.prefix}${command.name}`,
                    `${emoji} **Aliasy do nazwy**: ${command.aliases.length === 0 ? 'brak aliasów' : command.aliases.join(', ')}`,
                    `${emoji} **Opisy**:\n> - **długi**: ${command.description.main}\n> - **krótki**: ${command.description.short}`,
                    `${emoji} **Kategoria:** ${category.name} ${category.emoji}`,
                    `${emoji} **Argumenty**: ${formattedArgs.length === 0 ? 'brak' : `\n> - ${formattedArgs.join('\n> - ')}`}`,
                    `${emoji} **Uprawnienia**: ${
                        canUseCommand
                            ? ':thumbsdown: nie masz wymaganych uprawnień, by użyć tej komendy'
                            : ':thumbsup: możesz użyć tej komendy'
                    }\n> - **dozwolone role**: ${formattedAllowedRoles.length === 0 ? 'brak' : formattedAllowedRoles.join(', ')}\n> - **dozwoleni użytkownicy**: ${formattedAllowedUsers.length === 0 ? 'brak' : formattedAllowedUsers.join(', ')}`,
                ].join('\n')
            );

        return api.reply({ embeds: [embed] });
    },
};
