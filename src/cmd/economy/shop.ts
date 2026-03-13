import { Command, CommandAPI, CommandFlags } from '@/bot/command.js';
import { cfg } from '@/bot/cfg.js';

import { PredefinedColors } from '@/util/color.js';
import capitalizeFirst from '@/util/capitalizeFirst.js';

import * as dsc from 'discord.js';
import Money from '@/util/money.js';

import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.js';
import { ConfigEconomyShopCategory, ConfigEconomyShopOffer } from '@/bot/definitions/config/economy.js';
import { MinimalActionsFormatter } from '@/bot/apis/economy/format.js';

function buildSelectMenu(categories: ConfigEconomyShopCategory[]): dsc.StringSelectMenuBuilder {
    return new dsc.StringSelectMenuBuilder()
        .setCustomId('shop-select-category')
        .setPlaceholder('⚡ Wybierz kategorię...')
        .addOptions(
            categories.map((category) => ({
                label: capitalizeFirst(category.name).slice(0, 100),
                value: category.id.slice(0, 100),
                description: category.desc.slice(0, 100),
                emoji: category.emoji,
            }))
        );
}

function buildCategoryEmbed(category: ConfigEconomyShopCategory, offers: ConfigEconomyShopOffer[], api: CommandAPI): ReplyEmbed {
    const embed = new ReplyEmbed()
        .setTitle(`${category.emoji ?? '💳'} ${category.name}`)
        .setDescription(category.desc)
        .setColor(category.color);

    const formatter = new MinimalActionsFormatter(api.economy);

    for (const offer of offers) {
        const value = [
            `**${Money.fromDollarsFloat(offer.price).format()}** - ${offer.desc}`,
            ...formatter.format(offer.onBuy),
        ].join('\n');

        embed.addFields([{
            name: offer.name.slice(0, 256),
            value: value.slice(0, 1024),
            inline: false,
        }]);
    }

    if (offers.length === 0) {
        embed.addFields([{
            name: '\u200b',
            value: `W tej kategorii nic nie ma.`,
            inline: false,
        }]);
    }

    return embed;
}

export const shopCmd: Command = {
    name: 'shop',
    aliases: [],
    description: {
        main: 'Idź do jakiegoś Times Square i kup jakiś bezsensowny bullshit 10 razy drożej niż gdzie indziej.',
        short: 'Odwiedź sklep.'
    },
    flags: CommandFlags.Economy,

    permissions: {
        allowedRoles: null,
        allowedUsers: null,
    },
    expectedArgs: [
        {
            name: 'category',
            description: 'Kategoria lub "all" aby zobaczyć wszystkie',
            type: { base: 'string', trailing: true },
            optional: true,
        }
    ],

    async execute(api: CommandAPI) {
        const categories = cfg.features.economy.shop;
        const allOffers = cfg.features.economy.offers;

        const sendInteractiveMenu = async () => {
            const selectMenu = buildSelectMenu(categories);
            const row = new dsc.ActionRowBuilder<dsc.StringSelectMenuBuilder>().addComponents(selectMenu);

            const introEmbed = new ReplyEmbed()
                .setTitle('💳 Sklep')
                .setDescription([
                    'Wybierz kategorię z menu poniżej!',
                    `**Tip na przyszłość:** Możesz poprostu użyć \`${cfg.commands.prefix}shop <category>\`!`
                ].join('\n'))
                .setColor(PredefinedColors.LuminousVividPink);

            const replyMsg = await api.reply({ embeds: [introEmbed], components: [row] });

            const collector = replyMsg.createMessageComponentCollector({
                componentType: dsc.ComponentType.StringSelect,
                time: 60_000,
            });

            collector.on('collect', async (interaction: dsc.StringSelectMenuInteraction) => {
                if (interaction.user.id != api.invoker.id) {
                    await interaction.reply({ content: 'To menu nie jest dla Ciebie!', flags: ["Ephemeral"] });
                    return;
                }

                const chosenCategory = categories.find(c => c.id == interaction.values[0]);
                if (!chosenCategory) {
                    await interaction.reply({ content: 'Nie znaleziono tej kategorii!', flags: ["Ephemeral"] });
                    return;
                }

                const categoryOffers = [];
                for (const o of allOffers.filter(o => chosenCategory.items.includes(o.id))) {
                    if (o.buyOnce && await api.executor.purchases.getPurchaseCount(o.id) >= 1) continue;
                    categoryOffers.push(o);
                }
                categoryOffers.sort((a, b) => a.price - b.price);

                const embed = buildCategoryEmbed(chosenCategory, categoryOffers, api);
                await interaction.update({ embeds: [embed], components: [row] });
            });

            collector.on('end', async () => {
                const disabledRow = new dsc.ActionRowBuilder<dsc.StringSelectMenuBuilder>()
                    .addComponents(selectMenu.setDisabled(true));
                await replyMsg.edit({ components: [disabledRow] }).catch(() => {});
            });
        };

        const categoriesArg = api.getTypedArg('categories', 'string');
        if (!categoriesArg || !categoriesArg.value) {
            await sendInteractiveMenu();
            return;
        }

        const values = (categoriesArg.value as string).split(/\s+/);
        let categoriesToShow: ConfigEconomyShopCategory[] = [];

        if (values.includes('all')) {
            categoriesToShow = categories;
        } else {
            for (const val of values) {
                const category = categories.find(c => c.id == val);
                if (!category) {
                    api.log.replyError(api, 'Nieznana kategoria', `Nie znam kategorii ${val}. Czy możesz powtórzyć?`);
                    return;
                }
                categoriesToShow.push(category);
            }
        }

        const introEmbed = new ReplyEmbed()
            .setTitle('💳 Sklep')
            .setDescription(`Oto nasz asortyment, wybierz co chcesz a potem użyj \`${cfg.commands.prefix}buy <item>\` by to kupić.`)
            .setColor(PredefinedColors.LuminousVividPink);

        const allEmbeds = [introEmbed];
        for (const category of categoriesToShow) {
            let categoryOffers: ConfigEconomyShopOffer[] = [];
            for (const o of allOffers.filter(o => category.items.includes(o.id))) {
                if (o.buyOnce && await api.executor.purchases.getPurchaseCount(o.id) >= 1) continue;
                categoryOffers.push(o);
            }
            categoryOffers = categoryOffers.sort((a, b) => a.price - b.price);

            allEmbeds.push(buildCategoryEmbed(category, categoryOffers, api));
        }

        await api.reply({ embeds: allEmbeds });
    },
};
