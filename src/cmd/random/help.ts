import { Command } from '../../bot/command.js';
import { cfg } from '../../bot/cfg.js';
import { db, sqlite } from '../../bot/db.js';

import * as log from '../../util/log.js';
import * as cfgManager from '../../bot/cfgManager.js';
import * as automod from '../../bot/automod.js';

import * as dsc from 'discord.js';
import { PredefinedColors } from '../../util/color.js';
import { likeInASentence } from '../../util/lias.js';

export const helpCmd: Command = {
    name: 'help',
    desc: 'Pokazuje losowe komendy z bota, by w końcu nauczyć Twojego zapyziałego mózgu jego używania.',
    category: 'ogólne',
    expectedArgs: [],
    aliases: [],
    allowedRoles: null,
    allowedUsers: [],

    async execute(msg, args, commands) {
        let blockedCmds: string[] = [];
        const commandsByCategory: Record<string, dsc.APIEmbedField[]> = {};
        
        commands.forEach((command) => {
            if (
                command.allowedRoles != null &&
                !msg.member.roles.cache.some((role) => command.allowedRoles!.includes(role.id))
            ) {
                blockedCmds.push(`\`${command.name}\``);
                return;
            }

            if (!commandsByCategory[command.category]) {
                commandsByCategory[command.category] = [];
            }

            commandsByCategory[command.category].push({
                name: `:star: ${cfg.general.prefix}${command.name}`,
                value: `**Opis**: ${command.desc}`
            });
        });

        const categoryColors: {[key: string]: PredefinedColors} = {
            'ogólne': PredefinedColors.Brown,
            'moderacyjne rzeczy': PredefinedColors.Orange,
            'ekonomia': PredefinedColors.Yellow
        };

        const introEmbed = new dsc.EmbedBuilder()
            .setTitle('📢 Moje komendy, władzco!')
            .setDescription('Wybierz kategorię z menu poniżej, a pokażę Ci dostępne komendy. A jak chcesz wszystkie to wpisz `sudo help all`.')
            .setColor(PredefinedColors.Cyan);

        if (args[0] && args[0] === 'all') {
            const allEmbeds: dsc.EmbedBuilder[] = [];

            allEmbeds.push(
                introEmbed
            );

            for (const [category, fields] of Object.entries(commandsByCategory)) {
                const embed = new dsc.EmbedBuilder()
                    .setTitle(`📂 ${likeInASentence(category)}`)
                    .setColor(categoryColors[category] ?? PredefinedColors.Green)
                    .setFields(fields);

                allEmbeds.push(embed);
            }

            if (blockedCmds.length > 0) {
                allEmbeds[0].addFields({
                    name: ':confused: Mała informacja na początek!',
                    value: `Pominąłem niektóre komendy, ponieważ nie możesz ich użyć. Te komendy to: ${blockedCmds.join(', ')}.`
                });
            }

            await msg.reply({ embeds: allEmbeds });
            return;
        }

        const selectMenu = new dsc.StringSelectMenuBuilder()
            .setCustomId('help_select')
            .setPlaceholder('⚡ Wybierz kategorię...')
            .addOptions(
                Object.keys(commandsByCategory).map((category) => ({
                    label: likeInASentence(category),
                    value: category,
                }))
            );

        const row = new dsc.ActionRowBuilder<dsc.StringSelectMenuBuilder>().addComponents(selectMenu);

        if (blockedCmds.length > 0) {
            introEmbed.addFields({
                name: ':confused: Mała informacja na początek!',
                value: `Pominąłem niektóre komendy, ponieważ nie możesz ich użyć. Te komendy to: ${blockedCmds.join(', ')}.`
            });
        }

        await msg.reply({
            embeds: [introEmbed],
            components: [row]
        });

        const collector = msg.channel.createMessageComponentCollector({
            componentType: dsc.ComponentType.StringSelect,
            time: 60_000,
            filter: (i) => i.user.id === msg.author.id
        });

        collector.on('collect', async (interaction) => {
            const category = interaction.values[0];
            const fields = commandsByCategory[category];

            const embed = new dsc.EmbedBuilder()
                .setTitle(`📂 ${likeInASentence(category)}`)
                .setColor(categoryColors[category] ?? PredefinedColors.Green)
                .setFields(fields);

            await interaction.reply({ embeds: [embed], ephemeral: true });
        });
    },
};