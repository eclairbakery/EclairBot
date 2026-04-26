import { Category, Command } from '@/bot/command.ts';
import { cfg } from '@/bot/cfg.ts';

import { PredefinedColors } from '@/util/color.ts';
import capitalizeFirst from '@/util/capitalizeFirst.ts';
import canExecuteCmd from '@/util/cmd/canExecuteCmd.ts';

import * as dsc from 'discord.js';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.ts';
import { CommandFlags } from '../../bot/apis/commands/misc.ts';

const commandsCmd: Command = {
    name: 'commands',
    description: {
        main: 'Pokazuje pełną listę dostępnych komend bota.',
        short: 'Lista komend',
    },
    flags: CommandFlags.WorksInDM,

    expectedArgs: [
        {
            name: 'category',
            description: 'Kategoria komend, którą chcesz zobaczyć. Jeśli nie podasz, pokaże wszystkie. Oddziel je przecinkiem!',
            optional: true,
            type: { base: 'string' },
        },
    ],
    aliases: ['cmds', 'komendy'],
    permissions: {
        allowedRoles: null,
        allowedUsers: null,
    },

    async execute(api) {
        const commands = api.commands;
        let categoriesToShow: Set<Category> = new Set();

        const categoriesArg = api.getTypedArg('categories', 'string');

        if (
            !categoriesArg ||
            !categoriesArg.value ||
            categoriesArg.value.includes('all')
        ) {
            categoriesToShow = new Set([...commands.keys()]);
        } else {
            const categoriesList = categoriesArg.value
                .split(',')
                .map((s: string) => s.trim().toLowerCase());

            for (const arg of categoriesList) {
                const category = Category.fromString(arg);
                if (!category) {
                    api.log.replyError(
                        api,
                        'Nieznana kategoria',
                        `Nie znam kategori ${arg}. Czy możesz powtórzyć?`,
                    );
                    return;
                }
                categoriesToShow.add(category);
            }
        }

        const blockedCmds: string[] = [];
        for (const category of categoriesToShow) {
            const cmds = commands.get(category) || [];
            for (const cmd of cmds) {
                if (!canExecuteCmd(cmd, api.invoker.member ?? api.invoker.user)) blockedCmds.push(cmd.name);
            }
        }

        const embed = new ReplyEmbed()
            .setTitle('📢 Moje komendy, władzco!')
            .setDescription('O to lista komend podzielona na kategorie! A, no i o czywiście by nie śmiecić to sie nie wyświetlają komendy do których nie masz uprawnień.')
            .setColor(PredefinedColors.Cyan);

        for (const category of categoriesToShow) {
            const text: string[] = [];

            const cmds = commands.get(category) || [];
            for (let i = 0; i < cmds.length; i++) {
                const cmd = cmds[i];

                if (!canExecuteCmd(cmd, api.invoker.member ?? api.invoker.user)) {
                    continue;
                }

                let formattedName = `**${cfg.commands.prefix}${cmd.name}**`;
                if (cmd.aliases.length) {
                    formattedName += ` (aka `;
                    let firstAlias = true;
                    for (const al of cmd.aliases) {
                        formattedName += `${firstAlias ? '' : ' / '}\`${cfg.commands.prefix}${al}\``;
                        firstAlias = false;
                    } 
                    formattedName += ')';
                }

                text.push(formattedName);
            }

            if (text.length == 0) {
                text.push('*brak komend możliwych do użycia w tej kategorii*');
            }

            const categoryField: dsc.APIEmbedField = {
                name: `${category.emoji} ${capitalizeFirst(category.name)}`,
                value: text.join(', '),
                inline: false,
            };
            embed.addFields(categoryField);
        }

        api.reply({
            embeds: [embed],
        });
    },
};

export default commandsCmd;
