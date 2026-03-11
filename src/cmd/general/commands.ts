import { Category, Command, CommandFlags } from '@/bot/command.js';
import { cfg } from '@/bot/cfg.js';

import { PredefinedColors } from '@/util/color.js';
import capitalizeFirst from '@/util/capitalizeFirst.js';
import canExecuteCmd from '@/util/cmd/canExecuteCmd.js';

import * as dsc from 'discord.js';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.js';

export const commandsCmd: Command = {
    name: 'commands',
    description: {
        main: 'Pokazuje pełną listę dostępnych komend bota.',
        short: 'Lista komend',
    },
    flags: CommandFlags.None,

    expectedArgs: [
        {
            name: 'category',
            description: 'Kategoria komend, którą chcesz zobaczyć. Jeśli nie podasz, pokaże wszystkie. Oddziel je przecinkiem!',
            optional: true,
            type: { base: 'string' }
        }
    ],
    aliases: ['cmds', 'komendy'],
    permissions: {
        allowedRoles: null,
        allowedUsers: null,
    },

    async execute(api) {
        const commands = api.commands;
        let categoriesToShow: Set<Category> = new Set();

        const categoriesArg = api.getTypedArg("categories", "string");

        if (
            !categoriesArg ||
            !categoriesArg.value ||
            categoriesArg.value.includes("all")
        ) {
            categoriesToShow = new Set([...commands.keys()]);
        } else {
            const categoriesList = categoriesArg.value
                .split(",")
                .map((s: string) => s.trim().toLowerCase());

            for (const arg of categoriesList) {
                const category = Category.fromString(arg);
                if (!category) {
                    api.log.replyError(
                        api,
                        "Nieznana kategoria",
                        `Nie znam kategori ${arg}. Czy możesz powtórzyć?`
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
                if (!canExecuteCmd(cmd, api.invoker.member!)) blockedCmds.push(cmd.name);
            }
        }

        const embed = new ReplyEmbed()
            .setTitle('📢 Moje komendy, władzco!')
            .setDescription('O to lista komend podzielona na kategorie! A, no i o czywiście by nie śmiecić to sie nie wyświetlają komendy do których nie masz uprawnień.')
            .setColor(PredefinedColors.Cyan);

        for (const category of categoriesToShow) {
            let text: string = '';

            const cmds = commands.get(category) || [];
            for (let i = 0; i < cmds.length; i++) {
                const cmd = cmds[i];

                if (!canExecuteCmd(cmd, api.invoker.member!)) {
                    continue;
                }

                let formattedName = `**${cfg.legacy.general.prefix}${cmd.name}**`;
                if (cmd.aliases.length > 0) {
                    formattedName += ` *(a.k.a. \`${cfg.legacy.general.prefix}${cmd.aliases[0]}\`)*`;
                }

                text += i == 0 ? `${formattedName}` : `, ${formattedName}`;
            }

            if (text == '') {
                text = '*brak komend możliwych do użycia w tej kategorii*';
            }

            let categoryField: dsc.APIEmbedField = {
                name: `${category.emoji} ${capitalizeFirst(category.name)}`,
                value: text,
                inline: false,
            };
            embed.addFields(categoryField);
        }

        api.reply({
            embeds: [embed],
        });
    }
}
