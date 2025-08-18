import { Category, Command } from '../../bot/command.js';
import { cfg } from '../../bot/cfg.js';

import { PredefinedColors } from '../../util/color.js';
import { likeInASentence } from '../../util/lias.js';
import canExecuteCmd from '../../util/canExecuteCmd.js';

import * as log from '../../util/log.js';
import * as dsc from 'discord.js';

export const detailHelpCmd: Command = {
    name: 'help',
    longDesc: 'Pokazuje losowe komendy z bota wraz z dokładnymi opisami, by w końcu nauczyć Twojego zapyziałego mózgu jego używania.',
    shortDesc: 'Lista komend',
    expectedArgs: [],
    aliases: ['help'],
    allowedRoles: null,
    allowedUsers: [],

    async execute(msg, args, commands) {
        let categoriesToShow: Set<Category> = new Set();
        if (args.length == 0) categoriesToShow = new Set([...commands.keys()]);
        for (const arg of args) {
            if (arg == 'all') {
                categoriesToShow = new Set([...commands.keys()]);
                continue;
            }
            let category = Category.fromString(arg);
            if (category == null) {
                log.replyError(msg, 'Nieznana kategoria', `Nie znam kategori ${arg}. Czy możesz powtórzyć?`);
            }
            categoriesToShow.add(category)
        }
        let blockedCmds: Command[] = [];

        for (const category of categoriesToShow) {
            const cmds = commands.get(category);
            for (const cmd of cmds) {
                console.log(canExecuteCmd(cmd, msg.member))
                if (!canExecuteCmd(cmd, msg.member)) blockedCmds.push(cmd);
            }
        }

        const introEmbed = new dsc.EmbedBuilder()
            .setTitle('📢 Moje komendy, władzco!')
            .setDescription('O to lista komend podzielona na kategorie!')
            .setColor(PredefinedColors.Cyan);

        const allEmbeds: dsc.EmbedBuilder[] = [];
        allEmbeds.push(introEmbed);

        function buildHelpEmbed(category: Category, cmds: Command[]) {
            let embed = new dsc.EmbedBuilder()
                .setTitle(`${category.emoji} ${category.name}`)
                .setDescription(category.longDesc)
                .setColor(category.color)

            for (const cmd of cmds) {
                let formattedName = cmd.name;
                if (cmd.aliases.length == 1) {
                    formattedName += ` *(znane również jako \`${cfg.general.prefix}${cmd.aliases[0]}\`)*`;
                } else if (cmd.aliases.length >= 2) {
                    formattedName += ` *(znane również jako \`${cfg.general.prefix}${cmd.aliases[0]}\` i \`${cfg.general.prefix}${cmd.aliases[1]}\`)*`;
                }

                embed.addFields([
                    {
                        name: `:star: ${cfg.general.prefix}${formattedName}`,
                        value: cmd.longDesc,
                        inline: false,
                    }
                ])
            }
            return embed
        }

        for (const category of categoriesToShow) {
            const cmds = commands.get(category);
            const embed = buildHelpEmbed(category, cmds);
            allEmbeds.push(embed);
        }

        if (blockedCmds.length > 0) {
            introEmbed.addFields({
                name: ':confused: Mała informacja na początek!',
                value: `Pominąłem niektóre komendy, ponieważ nie możesz ich użyć. Te komendy to: ${blockedCmds.map(cmd => cmd.name).join(', ')}.`
            });
        }

        await msg.reply({ embeds: allEmbeds });
        return;
    },
};