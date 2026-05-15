import { Command } from '@/bot/command.ts';
import { CommandFlags } from '@/bot/apis/commands/misc.ts';
import { db, WarnRaw } from '@/bot/apis/db/bot-db.ts';
import * as dsc from 'discord.js';
import { PredefinedColors } from '@/util/color.ts';
import { client as cl } from '../../client.ts';
import { CommandPermissions } from '@/bot/apis/commands/permissions.ts';

const warnlistCmd: Command = {
    name: 'warnlist',
    aliases: ['warn-list', 'warnlista'],
    description: {
        main: 'Lubisz warnować? No to przeczytaj log tych warnów...',
        short: 'Pokazuje liste warnów',
    },
    flags: CommandFlags.Important,

    expectedArgs: [
        {
            name: 'user',
            type: { base: 'user-mention' },
            description: 'Użytkownik, którego warny chcesz zobaczyć (opcjonalne).',
            optional: true,
        },
    ],

    permissions: CommandPermissions.everyone(),

    async execute(api) {
        const client: dsc.Client = cl;
        const guild: dsc.Guild = api.guild!;

        const targetUser = api.getTypedArg('user', 'user-mention')?.value as dsc.GuildMember | undefined;
        const limit = 5;
        let currentPage = 1;

        async function fetchWarns(page: number) {
            let query = 'SELECT * FROM warns';
            const params: unknown[] = [];

            if (targetUser) {
                query += ' WHERE user_id = ?';
                params.push(targetUser.id);
            }

            query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
            params.push(limit, (page - 1) * limit);

            return await db.selectMany<WarnRaw & { user_id: string }>(query, params);
        }

        async function renderPage(page: number) {
            const rows = await fetchWarns(page);
            if (!rows.length) return null;

            const fields: dsc.APIEmbedField[] = [];
            let i = (page - 1) * limit;

            for (const row of rows) {
                i++;
                const user = await client.users.fetch(row.user_id).catch(() => null);
                const moderator = row.moderator_id ? await guild.members.fetch(row.moderator_id).catch(() => null) : null;

                let value = `\`${row.reason_string}\`\nWarn #${row.id}, punktów: \`${row.points}\` `;
                if (moderator) value += `, od <@${moderator.id}>`;
                if (row.expires_at) value += ` (wygasa <t:${row.expires_at}:R>)`;

                fields.push({
                    name: `${i}. Upomnienie dla ${user ? user.username : 'Nieznany użytkownik'}`,
                    value,
                });
            }

            const embed = api.log.getInfoEmbed(
                `Warny ${targetUser ? `dla ${targetUser.user.username}` : 'na serwerze'}`,
                'Oto wszystko co udało mi się znaleźć w naszej zaawansowanej bazie.'
            )
                .setFields(fields)
                .setColor(PredefinedColors.Blurple)
                .setFooter({ text: `Strona ${page}` });

            const components = new dsc.ActionRowBuilder<dsc.ButtonBuilder>().addComponents(
                new dsc.ButtonBuilder()
                    .setCustomId('prev')
                    .setLabel('◀️')
                    .setStyle(dsc.ButtonStyle.Secondary)
                    .setDisabled(page === 1),
                new dsc.ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('▶️')
                    .setStyle(dsc.ButtonStyle.Secondary)
                    .setDisabled(rows.length < limit),
            );

            return { embed, components };
        }

        const render = await renderPage(currentPage);
        if (!render) {
            return api.log.replyInfo(api, targetUser ? 'Czyste konto' : 'Wszyscy obywatele są grzeczni', targetUser ? `Nie znaleziono żadnych warnów dla ${targetUser.user.username}. Najwyraźniej dostawał ustne upomnienia, albo po prostu był grzeczny.` : 'Nie ma żadnych warnów w bazie. Najwyraźniej administracja jest po prostu leniwa by dawać warny albo zapomniała o tej funkcjonalności.');
        }

        const msg = await api.reply({
            embeds: [render.embed],
            components: [render.components],
        });

        const collector = msg.createMessageComponentCollector({
            time: 60_000,
            filter: (i) => i.user.id === api.invoker.id,
        });

        collector.on('collect', async (interaction) => {
            if (!interaction.isButton()) return;
            if (interaction.customId === 'prev' && currentPage > 1) currentPage--;
            else if (interaction.customId === 'next') currentPage++;

            const newRender = await renderPage(currentPage);
            if (!newRender) return interaction.deferUpdate();

            await interaction.update({
                embeds: [newRender.embed],
                components: [newRender.components],
            });
        });

        collector.on('end', async () => {
            await msg.edit({ components: [] }).catch(() => {});
        });
    },
};

export default warnlistCmd;
