import { Command, CommandFlags } from '@/bot/command.js';
import { cfg } from '@/bot/cfg.js';
import { db } from '@/bot/db.js';
import * as log from '@/util/log.js';
import * as dsc from 'discord.js';
import { PredefinedColors } from '@/util/color.js';
import { output } from '@/bot/logging.js';

export const warnlistCmd: Command = {
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
            type: 'user-mention',
            description: 'Użytkownik, którego warny chcesz zobaczyć (opcjonalne).',
            optional: true
        }
    ],

    permissions: {
        allowedRoles: cfg.commands.mod.warn.allowedRoles,
        allowedUsers: [],
        discordPerms: [],
    },

    async execute(api) {
        let client: dsc.Client;
        let guild: dsc.Guild;

        if (api.plainInteraction) {
            client = api.plainInteraction.client;
            guild = api.plainInteraction.guild!;
        } else if (api.plainMessage) {
            client = api.plainMessage.client;
            guild = api.plainMessage.guild!;
        } else {
            return log.replyError(api.msg, 'Błąd', 'Nie mogę znaleźć klienta bota...');
        }

        const targetUser = api.getTypedArg('user', 'user-mention-or-reference-msg-author')?.value as dsc.GuildMember | undefined;
        const limit = 10;
        let currentPage = 1;

        async function fetchWarns(page: number) {
            let query = 'SELECT * FROM warns';
            const params: any[] = [];

            if (targetUser) {
                query += ' WHERE user_id = ?';
                params.push(targetUser.id);
            }

            query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
            params.push(limit, (page - 1) * limit);

            return new Promise<any[]>((resolve, reject) => {
                db.all(query, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
        }

        async function renderPage(page: number) {
            const rows = await fetchWarns(page);
            if (!rows.length && page > 1) return null;

            const fields: dsc.APIEmbedField[] = [];
            let i = (page - 1) * limit;

            for (const row of rows) {
                i++;
                const user = await client.users.fetch(row.user_id).catch(() => null);
                const moderator = row.moderator_id
                    ? await guild.members.fetch(row.moderator_id).catch(() => null)
                    : null;

                let value = `\`${row.reason_string}\` (punktów: ${row.points}, id: ${row.id})`;
                if (moderator) value += `\n**Moderator:** <@${moderator.id}>`
                          else value += `\n**Moderator:** nieznany (warn pewnie pochodzi sprzed dodania moderator_id)`;
                if (row.expires_at) value += `\n**Wygasa:** <t:${row.expires_at}:R>`;

                fields.push({
                    name: `${i}. Upomnienie dla ${user ? user.username : 'Nieznany użytkownik'}`,
                    value
                });
            }

            const embed = new dsc.EmbedBuilder()
                .setTitle(`:loudspeaker: Warny ${targetUser ? `dla ${targetUser.user.username}` : 'na serwerze'}`)
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
                    .setDisabled(rows.length < limit)
            );

            return { embed, components };
        }

        let render = await renderPage(currentPage);
        if (!render) {
            return log.replyError(api.msg, 'Brak wyników', targetUser
                ? `Nie znaleziono żadnych warnów dla ${targetUser.user.username}.`
                : 'Nie ma żadnych warnów w bazie.');
        }

        const msg = await api.msg.reply({
            embeds: [render.embed],
            components: [render.components]
        });

        const collector = msg.createMessageComponentCollector({
            time: 60_000,
            filter: (i) => i.user.id === api.msg.author.id
        });

        collector.on('collect', async (interaction) => {
            if (!interaction.isButton()) return;
            if (interaction.customId === 'prev' && currentPage > 1) currentPage--;
            else if (interaction.customId === 'next') currentPage++;

            const newRender = await renderPage(currentPage);
            if (!newRender) return interaction.deferUpdate();

            await interaction.update({
                embeds: [newRender.embed],
                components: [newRender.components]
            });
        });

        collector.on('end', async () => {
            await msg.edit({ components: [] }).catch(() => {});
        });
    }
};