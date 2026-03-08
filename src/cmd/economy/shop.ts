import { Command, CommandAPI, CommandFlags } from '@/bot/command.js';
import { cfg } from '@/bot/cfg.js';

import { PredefinedColors } from '@/util/color.js';
import capitalizeFirst from '@/util/capitalizeFirst.js';

import * as dsc from 'discord.js';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.js';
import { formatMoney } from '@/util/math/format.js';
import { ConfigEconomyAction, ConfigEconomyShopCategory, ConfigEconomyShopOffer } from '@/bot/definitions/economy.js';

function formatItemActions(api: CommandAPI, actions: ConfigEconomyAction[]): string[] {
    let result: string[] = [];
    for (const action of actions) {
        switch (action.op) {
        case 'add-role':
            const role = api.economy.getRoleById(action.roleId);
            result.push(`Daje rolę <@&${role?.discordRoleId}>`);
            break;
        case 'add-item':
            const item = api.economy.getItemById(action.itemId);
            result.push(`Daje item \`${item?.name}\``);
            break;
        case 'add-money':
            result.push(`Daje ${formatMoney(action.amount)}`);
            break;
        default:
            break;
        }
    }
    return result;
}

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

    for (const offer of offers) {
        embed.addFields([{
            name: offer.name,
            value: [
                `${formatMoney(offer.price)} - ${offer.desc}`,
                ...formatItemActions(api, offer.onBuy),
            ].join('\n'),
            inline: false,
        }]);
    }

    if (offers.length === 0) {
        embed.addFields([{
            name: '',
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
            type: 'string',
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
                    `**Tip na przyszłość:** Możesz poprostu użyć \`${cfg.general.prefix} shop <category>\`!`
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

                const categoryOffers = allOffers
                    .filter(o => chosenCategory.items.includes(o.id))
                    .sort((a, b) => a.price - b.price);

                const embed = buildCategoryEmbed(chosenCategory, categoryOffers, api);
                await interaction.update({ embeds: [embed], components: [row] });
            });

            collector.on('end', async () => {
                const disabledRow = new dsc.ActionRowBuilder<dsc.StringSelectMenuBuilder>()
                    .addComponents(selectMenu.setDisabled(true));
                await replyMsg.edit({ components: [disabledRow] }).catch(() => {});
            });
        };

        const argCategory = api.getTypedArg('category', 'string');

        if (!argCategory || !argCategory.value) {
            await sendInteractiveMenu();
            return;
        }

        const values = (argCategory.value as string).split(/\s+/);
        let categoriesToShow: ConfigEconomyShopCategory[] = [];

        if (values.includes('all')) {
            categoriesToShow = categories;
        } else {
            for (const val of values) {
                const category = categories.find(c => c.id === val);
                if (!category) {
                    api.log.replyError(api, 'Nieznana kategoria', `Nie znam kategorii ${val}. Czy możesz powtórzyć?`);
                    return;
                }
                categoriesToShow.push(category);
            }
        }

        const introEmbed = new ReplyEmbed()
            .setTitle('💳 Sklep')
            .setDescription(`Oto nasz asortyment, wybierz co chcesz a potem użyj \`${cfg.general.prefix} buy <item>\` by to kupić.`)
            .setColor(PredefinedColors.LuminousVividPink);

        const allEmbeds = [introEmbed];
        for (const category of categoriesToShow) {
            const categoryOffers = allOffers.filter(o => category.items.includes(o.id)).sort((a, b) => a.price - b.price);
            allEmbeds.push(buildCategoryEmbed(category, categoryOffers, api));
        }

        await api.reply({ embeds: allEmbeds });
    },
};
