import * as dsc from 'discord.js';
import { Command } from '@/bot/command.ts';
import { CommandFlags } from '@/bot/apis/commands/misc.ts';
import { CommandPermissions } from '@/bot/apis/commands/permissions.ts';
import { CommandAPI } from '@/bot/apis/commands/api.ts';
import { cfg } from '@/bot/cfg.ts';
import { db } from '@/bot/apis/db/bot-db.ts';
import { output } from '@/bot/logging.ts';
import { getErrorEmbed, getSuccessEmbed, getWarnEmbed } from '@/util/log.ts';

const cmdCfg = cfg.commands.configuration.reset;

export const resetCmd: Command = {
    name: 'reset',
    aliases: cmdCfg.aliases,
    description: {
        main: 'Pozwala zresetować dane tabelay bazy danych (ekonomia, levele, cooldowny, warny, reputacja).',
        short: 'Resetuje dane bazy danych.',
    },
    flags: CommandFlags.Important | CommandFlags.Unsafe,

    expectedArgs: [
        {
            name: 'table',
            description: 'Co chcesz zresetować? (economy, leveling, cooldowns, warns, reputation, all)',
            type: { base: 'string' },
            optional: false,
        },
        {
            name: 'user',
            description: 'Użytkownik, którego dane chcesz zresetować (opcjonalnie, domyślnie wszyscy).',
            type: { base: 'user-mention', includeRefMessageAuthor: true },
            optional: true,
        },
    ],
    permissions: CommandPermissions.fromCommandConfig(cmdCfg),

    async execute(api: CommandAPI) {
        const table = api.getTypedArg('table', 'string')?.value?.toLowerCase();
        const targetUser = api.getTypedArg('user', 'user-mention')?.value as dsc.GuildMember | dsc.User | undefined;

        if (!table || !['economy', 'leveling', 'cooldowns', 'warns', 'reputation', 'all'].includes(table)) {
            return api.log.replyError(api, 'Niepoprawna tabela', 'Poprawne tabele: economy, leveling, cooldowns, warns, reputation, all');
        }

        const userId = targetUser?.id;
        const displayName = (targetUser as dsc.GuildMember)?.displayName ?? (targetUser as dsc.User)?.username ?? 'wszystkich';

        let warningText = '';
        if (!userId) {
            warningText = table === 'all' ? 'Właśnie próbujesz usunąć **WSZYSTKIE** dane dla **WSZYSTKICH UŻYTKOWNIKÓW**.' : `Właśnie próbujesz usunąć dane z tabeli **${table}** dla **WSZYSTKICH UŻYTKOWNIKÓW**.`;
        } else {
            warningText = table === 'all' ? `Właśnie próbujesz usunąć **WSZYSTKIE** dane użytkownika **${displayName}**.` : `Właśnie próbujesz usunąć dane z tabeli **${table}** dla użytkownika **${displayName}**.`;
        }
        warningText += '\n\n**Ta operacja jest nieodwracalna. Czy na pewno chcesz to zrobić?**';

        const confirmBtn = new dsc.ButtonBuilder()
            .setCustomId('reset-confirm')
            .setLabel('Potwierdź')
            .setStyle(dsc.ButtonStyle.Danger);

        const cancelBtn = new dsc.ButtonBuilder()
            .setCustomId('reset-cancel')
            .setLabel('Anuluj')
            .setStyle(dsc.ButtonStyle.Secondary);

        const row = new dsc.ActionRowBuilder<dsc.ButtonBuilder>().addComponents(confirmBtn, cancelBtn);
        const response = await api.reply({
            embeds: [getWarnEmbed('Ostrzeżenie', warningText)],
            components: [row],
        });

        const collector = response.createMessageComponentCollector({
            componentType: dsc.ComponentType.Button,
            time: 30 * 1000,
            filter: (i) => i.user.id == api.invoker.id,
        });

        collector.on('collect', async (interaction) => {
            if (interaction.customId == 'reset-confirm') {
                try {
                    switch (table) {
case 'economy':
                            await db.reset.economy(userId);
                            break;
case 'leveling':
                            await db.reset.leveling(userId);
                            break;
case 'cooldowns':
                            await db.reset.cooldowns(userId);
                            break;
case 'warns':
                            await db.reset.warns(userId);
                            break;
case 'reputation':
                            await db.reset.reputation(userId);
                            break;
case 'all':
                            await db.reset.all(userId);
                            break;
                    }

                    const scopeText = userId ? `dla użytkownika <@${userId}>` : 'dla WSZYSTKICH użytkowników';
                    await interaction.update({
                        embeds: [getSuccessEmbed('Reset zakończony', `Pomyślnie zresetowano tabele **${table}** ${scopeText}.`)],
                        components: [],
                    });
                } catch (err) {
                    output.err(err);
                    await interaction.update({
                        embeds: [getErrorEmbed('Błąd bazy danych', `Wystąpił problem podczas resetowania danych\nKod błędu: ${err}. Skontaktuj się z administracją.`)],
                        components: [],
                    });
                }
            } else {
                await interaction.update({
                    embeds: [getWarnEmbed('Anulowano', 'Admin się namyślił i anulował komende, ale może to i dobrze.')],
                    components: [],
                });
            }
            collector.stop();
        });

        collector.on('end', async (_, reason) => {
            if (reason === 'time') {
                await response.edit({
                    embeds: [getWarnEmbed('Czas minął', 'Operacja resetu wygasła')],
                    components: [],
                }).catch(() => {});
            }
        });
    },
};
