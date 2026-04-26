import { Command } from '@/bot/command.ts';
import { CommandFlags } from '@/bot/apis/commands/misc.ts';
import { PredefinedColors } from '@/util/color.ts';
import { cfg } from '@/bot/cfg.ts';

import findCommand from '@/util/cmd/find-command.ts';
import { Category } from '@/bot/command.ts';
import { findCmdConfResolvable } from '@/util/cmd/findCmdConfigObj.ts';
import fmtEmoji from '@/util/fmt-emoji.ts';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.ts';

const manCmd: Command = {
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
            type: { base: 'string' },
        },
    ],
    aliases: [],
    permissions: {
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
                            short: 'No kobieta bratku.',
                        },
                        aliases: ['kobieta', 'żona', 'dziewczyna'],
                        flags: CommandFlags.None,
                        expectedArgs: [
                            {
                                name: 'odciąż mnie',
                                description: 'Wszystko muszę robić sama. Nie mam z wami żadnego pożytku',
                                optional: false,
                                type: { base: 'string' },
                            },
                        ],
                        permissions: {
                            allowedRoles: [],
                            allowedUsers: [],
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
                api,
                'Nie tędy droga...',
                "No nie wiem jak ty, ale ja bym wolał, żeby man opisywał funkcje, które już znasz.\nDokładne logi błędu:\n```What manual page do you want?\nFor example, try 'man man'.```",
            );
        }

        const found = findCommand(cmdName ?? 'man', manuals);

        if (!found) {
            return api.log.replyError(
                api,
                'Nie tędy droga...',
                `Tak w ogóle, to wiesz, że nawet nie ma takiej komendy?\nDokładne logi błędu:\n\`\`\`No manual entry for ${cmdName}\`\`\``,
            );
        }

        const { command, category } = found;

        if (!findCmdConfResolvable(command.name).enabled) {
            return api.log.replyWarn(api, 'Ta komenda jest wyłączona.', 'Nie dowiesz się o niej nic, dopóki nie zostanie włączona.');
        }

        const formattedArgs = command.expectedArgs.map((arg) => `**${arg.name}**: ${arg.description}`);

        const formattedAllowedRoles: string[] = command.permissions.allowedRoles !== null ? command.permissions.allowedRoles.map((role: string) => `<@&${role}>`) : ['każda rola'];

        const formattedAllowedUsers: string[] = command.permissions.allowedUsers !== null ? command.permissions.allowedUsers.map((user: string) => `<@${user}>`) : ['każdy użytkownik'];

        const emoji: string = fmtEmoji({
            name: 'emoji_kropa',
            id: '1430647658736914622',
        });

        const canUseCommand = command.permissions.allowedRoles != null &&
            api.invoker.member &&
            api.invoker.member.roles &&
            api.invoker.member.roles.cache.some((role) => command.permissions.allowedRoles!.includes(role.id));

        const embed = new ReplyEmbed()
            .setTitle(':loudspeaker: Instrukcja')
            .setColor(category.color)
            .setDescription(
                [
                    `${emoji} **Wywołanie:** ${cfg.commands.prefix}${command.name}`,
                    `${emoji} **Aliasy do nazwy**: ${command.aliases.length === 0 ? 'brak aliasów' : command.aliases.join(', ')}`,
                    `${emoji} **Opisy**:\n> - **długi**: ${command.description.main}\n> - **krótki**: ${command.description.short}\n`,
                    `${emoji} **Kategoria:** ${category.name} ${category.emoji}`,
                    `${emoji} **Argumenty**: ${formattedArgs.length === 0 ? 'brak' : `\n> - ${formattedArgs.join('\n> - ')}`}\n`,
                    `${emoji} **Uprawnienia**: ${canUseCommand ? ':thumbsdown: nie masz wymaganych uprawnień, by użyć tej komendy' : ':thumbsup: możesz użyć tej komendy'}\n> - **dozwolone role**: ${formattedAllowedRoles.length === 0 ? 'brak' : formattedAllowedRoles.join(', ')}\n> - **dozwoleni użytkownicy**: ${formattedAllowedUsers.length === 0 ? 'brak' : formattedAllowedUsers.join(', ')}`,
                ].join('\n'),
            );

        return api.reply({ embeds: [embed] });
    },
};

export default manCmd;
