import { Category, Command } from '@/bot/command.js';
import { cfg } from '@/bot/cfg.js';

import { PredefinedColors } from '@/util/color.js';
import capitalizeFirst from '@/util/capitalizeFirst.js';
import canExecuteCmd from '@/util/canExecuteCmd.js';

import * as log from '@/util/log.js';
import * as dsc from 'discord.js';

export const commandsCmd: Command = {
    name: 'commands',
    description: {
        main: 'Pokazuje pełną listę dostępnych komend bota.',
        short: 'Lista komend',
    },
    expectedArgs: [
        {
            name: 'category',
            description: 'Kategoria komend, którą chcesz zobaczyć. Jeśli nie podasz, pokaże wszystkie. Oddziel je przecinkiem!',
            optional: true,
            type: 'string'
        }
    ],
    aliases: ['cmds', 'komendy'],
    permissions: {
        discordPerms: [],
        allowedRoles: null,
        allowedUsers: null,
    },

    async execute(api) {
        const commands = api.commands;
        let categoriesToShow: Set<Category> = new Set();
        if (api.args.length == 0 || !api.args[0]!.value || (api.args[0]?.value as string).includes('all')) {
            categoriesToShow = new Set([...commands.keys()]);
        } else {
            const categoriesList = (api.args[0]!.value as string).split(',').map(s => s.trim().toLowerCase());
            for (const arg of categoriesList) {
                const category = Category.fromString(arg);
                if (!category) {
                    log.replyError(api.msg, 'Nieznana kategoria', `Nie znam kategori ${arg}. Czy możesz powtórzyć?`);
                    return;
                }
                categoriesToShow.add(category);
            }
        }

        const blockedCmds: string[] = [];
        for (const category of categoriesToShow) {
            const cmds = commands.get(category) || [];
            for (const cmd of cmds) {
                if (!canExecuteCmd(cmd, api.msg.member.plainMember)) blockedCmds.push(cmd.name);
            }
        }

        const embed = new dsc.EmbedBuilder()
            .setTitle('📢 Moje komendy, władzco!')
            .setDescription('O to lista komend podzielona na kategorie! Zauważ że komendy których możesz użyć są oznaczone pogrubieniem, a te których nie możesz nie.')
            .setColor(PredefinedColors.Cyan);

        for (const category of categoriesToShow) {
            let text: string = '';

            const cmds = commands.get(category) || [];
            for (let i = 0; i < cmds.length; i++) {
                const cmd = cmds[i];

                let formattedName = `${cfg.general.prefix}${cmd.name}`;
                if (cmd.aliases.length > 0) {
                    formattedName += ` *(a.k.a. \`${cfg.general.prefix}${cmd.aliases[0]}\`)*`;
                }

                if (canExecuteCmd(cmd, api.msg.member.plainMember)) {
                    formattedName = `**${formattedName}**`;
                }

                text += i == 0 ? `${formattedName}` : `, ${formattedName}`;
            }

            let categoryField: dsc.APIEmbedField = {
                name: `${category.emoji} ${capitalizeFirst(category.name)}`,
                value: text,
                inline: false,
            };
            embed.addFields(categoryField);
        }

        api.msg.reply({
            embeds: [embed],
        });
    }
}