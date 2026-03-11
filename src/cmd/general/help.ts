import { Category, Command, CommandAPI, CommandFlags } from '@/bot/command.js';
import { cfg } from '@/bot/cfg.js';

import { PredefinedColors } from '@/util/color.js';
import capitalizeFirst from '@/util/capitalizeFirst.js';
import canExecuteCmd from '@/util/cmd/canExecuteCmd.js';

import * as dsc from 'discord.js';
import { findCmdConfResolvable } from '@/util/cmd/findCmdConfigObj.js';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.js';

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

function buildIntroEmbed(isQuick: boolean): ReplyEmbed {
    return new ReplyEmbed()
        .setTitle('📢 Moje komendy, władzco!')
        .setDescription(
            'Wybierz kategorię z menu poniżej, aby zobaczyć jej komendy! ' +
            (isQuick
                ? ('Plus, używasz uproszczonej wersji `help`. ' +
                'Użyj `detail-help`/`man`, jak serio się chcesz komend nauczyć...')
                : '')
        )
        .setColor(PredefinedColors.Cyan);
}

function buildCategoryEmbed(
    category: Category,
    cmds: Command[],
    blockedCmds: string[] = [],
    isQuick: boolean
): ReplyEmbed {
    const embed = new ReplyEmbed()
        .setTitle(`${category.emoji} ${category.name}`)
        .setDescription(category.longDesc)
        .setColor(category.color);

    for (const cmd of cmds) {
        if (blockedCmds.includes(cmd.name)) continue;

        let formattedName = cmd.name;

        if (cmd.aliases.length === 1) {
            formattedName += ` *(a.k.a. \`${cfg.legacy.general.prefix}${cmd.aliases[0]}\`)*`;
        } else if (cmd.aliases.length >= 2) {
            formattedName += ` *(a.k.a. \`${cfg.legacy.general.prefix}${cmd.aliases[0]}\` i \`${cfg.legacy.general.prefix}${cmd.aliases[1]}\`)*`;
        }

        embed.addFields({
            name: '',
            value: `**:star: ${cfg.legacy.general.prefix}${formattedName}:** ${isQuick ? cmd.description.short : cmd.description.main}`,
            inline: false,
        });
    }

    if (!embed.toJSON().fields || !embed.toJSON().fields?.[0]) {
        embed.addFields({
            name: '',
            value: `W tej kategorii nic nie ma. Lub jest przestrzała.`,
            inline: false,
        });
    }

    return embed;
}

function getBlockedCommands(
    commands: Map<Category, Command[]>,
    categories: Set<Category>,
    member: dsc.GuildMember | null
): string[] {
    const blocked: string[] = [];

    for (const category of categories) {
        const cmds = commands.get(category) ?? [];

        for (const cmd of cmds) {
            if (!member || !canExecuteCmd(cmd, member)) blocked.push(cmd.name);
            else if (!findCmdConfResolvable(cmd.name).enabled) blocked.push(cmd.name);
            else if (cmd.flags & CommandFlags.Deprecated) blocked.push(cmd.name);
        }
    }

    return blocked;
}

export const helpCmd: Command = {
    name: 'help',
    aliases: ['quick-help', 'detail-help'],
    description: {
        main: 'Pokazuje losowe komendy z bota wraz z opisami, by w końcu nauczyć Twojego zapyziałego mózgu jego używania.',
        short: 'Lista komend',
    },
    flags: CommandFlags.None,

    permissions: {
        allowedRoles: null,
        allowedUsers: [],
    },

    expectedArgs: [
        {
            name: 'category',
            description: 'Kategoria lub "all" aby zobaczyć wszystkie',
            type: { base: 'string' },
            optional: true,
        }
    ],

    async execute(api: CommandAPI) {
        const { commands } = api;

        const isQuick = api.invokedViaAlias !== 'detail-help';
        const argCategory = api.getTypedArg('category', 'string');

        const sendInteractiveMenu = async () => {
            const selectMenu = buildSelectMenu(commands);
            const row = new dsc.ActionRowBuilder<dsc.StringSelectMenuBuilder>().addComponents(selectMenu);

            const introEmbed = buildIntroEmbed(isQuick);
            const replyMsg = await api.reply({ embeds: [introEmbed], components: [row] });

            const collector = replyMsg.createMessageComponentCollector({
                componentType: dsc.ComponentType.StringSelect,
                time: 60000,
            });

            collector.on('collect', async (interaction: dsc.StringSelectMenuInteraction) => {
                if (interaction.user.id !== api.invoker.id) {
                    await interaction.reply({ content: 'To menu nie jest dla Ciebie!', flags: ["Ephemeral"] });
                    return;
                }

                const chosenCategory = [...commands.keys()].find(c => c.name === interaction.values[0]);

                if (!chosenCategory) {
                    await interaction.reply({ content: 'Nie znaleziono tej kategorii!', flags: ["Ephemeral"] });
                    return;
                }

                const cmds = commands.get(chosenCategory) ?? [];
                const embed = buildCategoryEmbed(chosenCategory, cmds, [], isQuick);

                await interaction.update({ embeds: [embed], components: [row] });
            });

            collector.on('end', async () => {
                const disabledRow = new dsc.ActionRowBuilder<dsc.StringSelectMenuBuilder>()
                    .addComponents(selectMenu.setDisabled(true));

                await replyMsg.edit({ components: [disabledRow] }).catch(() => {});
            });
        };

        if (!argCategory?.value) {
            await sendInteractiveMenu();
            return;
        }

        const values = (argCategory.value as string).split(/\s+/);
        const categoriesToShow: Set<Category> = new Set();

        if (values.includes('all')) {
            for (const c of commands.keys()) categoriesToShow.add(c);
        } else {
            for (const val of values) {
                const category = Category.fromString(val);

                if (!category) {
                    api.log.replyError(api, 'Nieznana kategoria', `Nie znam kategorii ${val}. Czy możesz powtórzyć?`);
                    return;
                }

                categoriesToShow.add(category);
            }
        }

        const blockedCmds =
            api.invoker.member
                ? getBlockedCommands(commands, categoriesToShow, api.invoker.member)
                : [];

        const introEmbed = new ReplyEmbed()
            .setTitle('📢 Moje komendy, władzco!')
            .setDescription(
                'O to lista komend podzielona na kategorie!' +
                (isQuick
                    ? ('Plus, używasz uproszczonej wersji `help`. ' +
                    'Użyj `detail-help`/`man`, jak serio się chcesz komend nauczyć...')
                    : '')
            )
            .setColor(PredefinedColors.Cyan);

        if (blockedCmds.length > 0) {
            introEmbed.addFields({
                name: ':confused: Mała informacja na początek!',
                value: `Pominąłem niektóre komendy, ponieważ nie możesz ich użyć lub są przestarzałe. Te komendy to: ${blockedCmds.join(', ')}.`
            });
        }

        const allEmbeds: ReplyEmbed[] = [introEmbed];

        for (const category of categoriesToShow) {
            const cmds = commands.get(category) ?? [];
            allEmbeds.push(buildCategoryEmbed(category, cmds, blockedCmds, isQuick));
        }

        await api.reply({ embeds: allEmbeds });
    },
};
