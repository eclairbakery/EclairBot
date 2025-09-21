import { Category, Command, CommandAPI, CommandFlags } from '@/bot/command.js';
import { cfg } from '@/bot/cfg.js';

import { PredefinedColors } from '@/util/color.js';
import capitalizeFirst from '@/util/capitalizeFirst.js';
import canExecuteCmd from '@/util/canExecuteCmd.js';

import * as log from '@/util/log.js';
import * as dsc from 'discord.js';

function buildSelectMenu(commands: Map<Category, Command[]>): dsc.StringSelectMenuBuilder {
    return new dsc.StringSelectMenuBuilder()
        .setCustomId('help_select')
        .setPlaceholder('⚡ Wybierz kategorię...')
        .addOptions(
            [...commands.keys()].map((category: Category) => ({
                label: capitalizeFirst(category.name),
                value: category.name,
                emoji: category.emoji ?? undefined,
                description: category.shortDesc ?? undefined,
            }))
        );
}

function buildCategoryEmbed(category: Category, cmds: Command[], blockedCmds: string[] = []): dsc.EmbedBuilder {
    const embed = new dsc.EmbedBuilder()
        .setTitle(`${category.emoji} ${category.name}`)
        .setDescription(category.longDesc)
        .setColor(category.color);

    for (const cmd of cmds) {
        if (blockedCmds.includes(cmd.name)) continue;

        let formattedName = cmd.name;
        if (cmd.aliases.length === 1) {
            formattedName += ` *(a.k.a. \`${cfg.general.prefix}${cmd.aliases[0]}\`)*`;
        } else if (cmd.aliases.length >= 2) {
            formattedName += ` *(a.k.a. \`${cfg.general.prefix}${cmd.aliases[0]}\` i \`${cfg.general.prefix}${cmd.aliases[1]}\`)*`;
        }

        embed.addFields([{
            name: `:star: ${cfg.general.prefix}${formattedName}`,
            value: cmd.description.main,
            inline: false,
        }]);
    }

    return embed;
}

export const detailHelpCmd: Command = {
    name: 'detail-help',
    description: {
        main: 'Pokazuje losowe komendy z bota wraz z dokładnymi opisami, by w końcu nauczyć Twojego zapyziałego mózgu jego używania.',
        short: 'Lista komend',
    },
    flags: CommandFlags.Spammy,

    permissions: {
        discordPerms: null,
        allowedRoles: null,
        allowedUsers: [],
    },
    expectedArgs: [
        {
            type: 'string',
            optional: true,
            name: 'category',
            description: 'Kategoria lub "all" aby zobaczyć wszystkie',
        }
    ],
    aliases: [],

    async execute(api: CommandAPI) {
        const { msg, commands } = api;

        const sendInteractiveMenu = async () => {
            const selectMenu = buildSelectMenu(commands);
            const row = new dsc.ActionRowBuilder<dsc.StringSelectMenuBuilder>().addComponents(selectMenu);

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

                const chosenCategory = [...commands.keys()].find(c => c.name === interaction.values[0]);
                if (!chosenCategory) {
                    await interaction.reply({ content: 'Nie znaleziono tej kategorii!', flags: ["Ephemeral"] });
                    return;
                }

                const cmds = commands.get(chosenCategory) ?? [];
                const embed = buildCategoryEmbed(chosenCategory, cmds);
                await interaction.update({ embeds: [embed], components: [row] });
            });

            collector.on('end', async () => {
                const disabledRow = new dsc.ActionRowBuilder<dsc.StringSelectMenuBuilder>()
                    .addComponents(selectMenu.setDisabled(true));
                await replyMsg.edit({ components: [disabledRow] }).catch(() => {});
            });
        };

        const argCategory = api.getArg('category') as any;

        if (!argCategory || !argCategory.value) {
            await sendInteractiveMenu();
            return;
        }

        const values = (argCategory.value as string).split(/\s+/);
        let categoriesToShow: Set<Category> = new Set();

        if (values.includes('all')) {
            categoriesToShow = new Set([...commands.keys()]);
        } else {
            for (const val of values) {
                const category = Category.fromString(val);
                if (!category) {
                    log.replyError(msg, 'Nieznana kategoria', `Nie znam kategorii ${val}. Czy możesz powtórzyć?`);
                    return;
                }
                categoriesToShow.add(category);
            }
        }

        const blockedCmds: string[] = [];
        for (const category of categoriesToShow) {
            const cmds = commands.get(category) || [];
            for (const cmd of cmds) {
                if (!canExecuteCmd(cmd, msg.member.plainMember)) blockedCmds.push(cmd.name);
            }
        }

        const introEmbed = new dsc.EmbedBuilder()
            .setTitle('📢 Moje komendy, władzco!')
            .setDescription('O to lista komend podzielona na kategorie!')
            .setColor(PredefinedColors.Cyan);

        const allEmbeds = [introEmbed];
        for (const category of categoriesToShow) {
            const cmds = commands.get(category) || [];
            allEmbeds.push(buildCategoryEmbed(category, cmds, blockedCmds));
        }

        if (blockedCmds.length > 0) {
            introEmbed.addFields({
                name: ':confused: Mała informacja na początek!',
                value: `Pominąłem niektóre komendy, ponieważ nie możesz ich użyć. Te komendy to: ${blockedCmds.join(', ')}.`
            });
        }

        await msg.reply({ embeds: allEmbeds });
    },
};
