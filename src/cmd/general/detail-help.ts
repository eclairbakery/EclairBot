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
    aliases: ['detail-help'],
    allowedRoles: null,
    allowedUsers: [],

    async execute(msg, args, commands) {
        let categoriesToShow: Set<Category> = new Set();

        if (args.length == 0) {
            const selectMenu = new dsc.StringSelectMenuBuilder()
                .setCustomId('help_select')
                .setPlaceholder('⚡ Wybierz kategorię...')
                .addOptions(
                    [...commands.keys()].map((category: Category) => ({
                        label: likeInASentence(category.name),
                        value: category.name,
                        emoji: category.emoji ?? undefined,
                        description: category.shortDesc ?? undefined,
                    }))
                );

            const row = new dsc.ActionRowBuilder<dsc.StringSelectMenuBuilder>()
                .addComponents(selectMenu);

            const introEmbed = new dsc.EmbedBuilder()
                .setTitle('📢 Moje komendy, władzco!')
                .setDescription('Wybierz kategorię z menu poniżej, aby zobaczyć jej komendy!')
                .setColor(PredefinedColors.Cyan);

            const replyMsg = await msg.reply({ embeds: [introEmbed], components: [row] });

            const collector = replyMsg.createMessageComponentCollector({
                componentType: dsc.ComponentType.StringSelect,
                time: 60_000, 
            });

            collector.on('collect', async (interaction: dsc.StringSelectMenuInteraction) => {
                if (interaction.user.id !== msg.author.id) {
                    await interaction.reply({ content: 'To menu nie jest dla Ciebie!', flags: ["Ephemeral"] });
                    return;
                }

                const chosen = interaction.values[0];
                const category = [...commands.keys()].find(c => c.name === chosen);
                if (!category) {
                    await interaction.reply({ content: 'Nie znaleziono tej kategorii!', flags: ["Ephemeral"] });
                    return;
                }

                const cmds = commands.get(category) ?? [];

                const embed = new dsc.EmbedBuilder()
                    .setTitle(`${category.emoji} ${category.name}`)
                    .setDescription(category.longDesc)
                    .setColor(category.color);

                for (const cmd of cmds) {
                    embed.addFields({
                        name: `:star: ${cfg.general.prefix}${cmd.name}`,
                        value: cmd.longDesc,
                        inline: false,
                    });
                }

                await interaction.update({ embeds: [embed], components: [row] });
            });

            collector.on('end', async () => {
                const disabledRow = new dsc.ActionRowBuilder<dsc.StringSelectMenuBuilder>()
                    .addComponents(selectMenu.setDisabled(true));
                await replyMsg.edit({ components: [disabledRow] }).catch(() => {});
            });

            return;
        }

        if (args[0] == 'all') categoriesToShow = new Set([...commands.keys()]);
        for (const arg of args) {
            if (arg == 'all') {
                categoriesToShow = new Set([...commands.keys()]);
                continue;
            }
            let category = Category.fromString(arg);
            if (category == null) {
                log.replyError(msg, 'Nieznana kategoria', `Nie znam kategori ${arg}. Czy możesz powtórzyć?`);
                return;
            } else {
                categoriesToShow.add(category);
            }
        }

        let blockedCmds: string[] = [];

        for (const category of categoriesToShow) {
            const cmds = commands.get(category) || [];
            for (const cmd of cmds) {
                if (!canExecuteCmd(cmd, msg.member)) blockedCmds.push(cmd.name);
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
                .setColor(category.color);

            for (const cmd of cmds) {
                if (blockedCmds.includes(cmd.name)) continue;

                let formattedName = cmd.name;
                if (cmd.aliases.length == 1) {
                    formattedName += ` *(a.k.a. \`${cfg.general.prefix}${cmd.aliases[0]}\`)*`;
                } else if (cmd.aliases.length >= 2) {
                    formattedName += ` *(a.k.a. \`${cfg.general.prefix}${cmd.aliases[0]}\` i \`${cfg.general.prefix}${cmd.aliases[1]}\`)*`;
                }

                embed.addFields([
                    {
                        name: `:star: ${cfg.general.prefix}${formattedName}`,
                        value: cmd.longDesc,
                        inline: false,
                    }
                ]);
            }
            return embed;
        }

        for (const category of categoriesToShow) {
            const cmds = commands.get(category);
            const embed = buildHelpEmbed(category, cmds || []);
            allEmbeds.push(embed);
        }

        if (blockedCmds.length > 0) {
            introEmbed.addFields({
                name: ':confused: Mała informacja na początek!',
                value: `Pominąłem niektóre komendy, ponieważ nie możesz ich użyć. Te komendy to: ${blockedCmds.join(', ')}.`
            });
        }

        await msg.reply({ embeds: allEmbeds });
        return;
    },
};