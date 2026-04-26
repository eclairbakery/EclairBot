import { Command } from '@/bot/command.ts';
import { CommandFlags } from '@/bot/apis/commands/misc.ts'; 
import { CommandPermissions } from '@/bot/apis/commands/permissions.ts'; 

import * as dsc from 'discord.js';
import { db } from '@/bot/apis/db/bot-db.ts';
import User from '@/bot/apis/db/user.ts';
import { addLvlRole, xpToLevel } from '@/bot/level.ts';

const addAltAccountCommand: Command = {
    name: 'add-primary-account',
    aliases: [],
    description: {
        main: 'Dodajesz se swojego alta i masz wiele rzeczy współdzielonych tj. level.',
        short: 'Współdziel rzeczy ze swoim primary kontem.'
    },

    flags: CommandFlags.Unsafe,
    permissions: CommandPermissions.everyone(),

    expectedArgs: [
        {
            name: 'primary',
            type: { base: 'user-mention' },
            optional: false,
            description: "Twoje główne konto, któremu wszystko oddasz."
        }
    ],

    async execute(api) {
        if (api.executor.id !== api.invoker.id) 
            return api.log.replyError(api, 'Błąd', 'Już jesteś czyimś altem.');

        const primary = api.getTypedArg('primary', 'user-mention').value;

        if (api.invoker.id == primary.id)
            return api.log.replyError(api, 'Błąd', 'Tak, gratulacje, Twoje główne konto do którego chcesz się dołączyć to właśnie te konto. Szczyt geniuszu.');

        if (await db.selectOne("SELECT * FROM alternative_accounts WHERE primary_account = ?", [api.invoker.id])) 
            return api.log.replyError(api, 'Błąd', "Nie możesz zostać swoim altem będąc jednocześnie swoim głównym kontem.");

        const buildRow = (confirmId: string, cancelId: string) => {
            const confirm = new dsc.ButtonBuilder()
                .setCustomId(confirmId)
                .setLabel('Potwierdź')
                .setStyle(dsc.ButtonStyle.Danger);

            const cancel = new dsc.ButtonBuilder()
                .setCustomId(cancelId)
                .setLabel('Anuluj')
                .setStyle(dsc.ButtonStyle.Secondary);

            return new dsc.ActionRowBuilder<dsc.ButtonBuilder>()
                .addComponents(confirm, cancel);
        };

        const firstRow = buildRow('alt-confirm', 'alt-cancel');

        const response = await api.reply({
            embeds: [
                api.log.getWarnEmbed(
                    'Ostrzeżenie',
                    `Właśnie zamierzasz **ODDAĆ CAŁY SWÓJ PROGRESS NA RZECZ UŻYTKOWNIKA <@${primary.id}>!**. Zasoby będą współdzielone pomiędzy Tymi dwoma kontami, co oznacza, że będziesz w stanie z dwóch kont korzystać np. ze swoich pieniędzy na ekonomii. Po transferze, cały twój indywidualny postęp **zostanie bezpowrotnie usunięty** z bazy danych, sprawiając, że jeżeli będziesz chciał się odłączyć, będziesz musiał to przeprowadzić z pomocą administracji i zaczynać od nowa...\n\n`
                    + 'Ta operacja jest **nieodwracalna**.'
                )
            ],
            components: [firstRow],
        });

        const collector = response.createMessageComponentCollector({
            componentType: dsc.ComponentType.Button,
            time: 90_000,
            filter: (i) => i.user.id === api.invoker.id || i.user.id === primary.id,
        });

        const handleAction = async (interaction: dsc.ButtonInteraction) => {
            if (interaction.customId === 'alt-cancel') {
                await interaction.update({
                    embeds: [
                        api.log.getWarnEmbed(
                            'Anulowano',
                            'Gratulacje rozsądku guy!'
                        )
                    ],
                    components: []
                });
                collector.stop();
                return;
            }

            if (interaction.customId === 'alt-confirm') {
                if (interaction.user.id !== api.invoker.id) return;

                await interaction.update({
                    embeds: [
                        api.log.getTipEmbed(
                            'Potrzebujesz drugiej strony, aby dokończyć operację.',
                            'Musisz sprawić by twój primary się zespawnił i autoryzował tę operację.\n\n'
                            + '### Jeżeli zostałeś poproszony, aby autoryzować tę operację przez inną osobę na serwerze, to na pewno jest scam.\n'
                            + 'Ta komenda sprawi, że **będziesz współdzielić bardzo wiele danych z użytkownikiem, który wykonał tę komendę**, tj. poziomy czy pieniądze na ekonomii. **To również oznacza, że uznajesz te konto za swojego alta**, co z kolei oznacza, że **jeżeli tamta osoba dostanie bana, to ty automatycznie też**.\n\n'
                            + '**Ta operacja jest nieodwracalna.**'
                        )
                    ],
                    components: [buildRow('primary-confirm', 'primary-cancel')],
                });
 
                return;
            }

            if (interaction.customId === 'primary-cancel') {
                await interaction.update({
                    embeds: [
                        api.log.getWarnEmbed(
                            'Anulowano',
                            'Gratulacje rozsądku guy!'
                        )
                    ],
                    components: []
                });

                collector.stop();
                return;
            }

            if (interaction.customId === 'primary-confirm') {
                if (interaction.user.id !== primary.id) return;

                collector.stop();
                
                const user_inv = new User(api.invoker.id);
                await db.runSql("INSERT INTO alternative_accounts VALUES (?, ?);", [primary.id, api.invoker.id]);
                const user_primary = new User(primary.id);
                
                // leveling
                user_primary.leveling.addXP(await user_inv.leveling.getXP());
                addLvlRole(api.invoker.member!.guild, xpToLevel(await user_primary.leveling.getXP()), api.invoker.member!.id);

                // economy
                const economy_balance = await user_inv.economy.getBalance();
                user_primary.economy.addBankMoney(economy_balance.bank.add(economy_balance.wallet)); 

                // very scary 
                await db.reset.all(api.invoker.id);

                await response.edit({
                    embeds: [
                        api.log.getSuccessEmbed(
                            'Sukces',
                            `Od teraz <@${primary.id}> jest oficjalnie twym głównem kontem.\nJeżeli czegoś nie masz, poproś administrację o dodanie Ci tego na alcie.`
                        )
                    ],
                    components: []
                });
            }
        };

        collector.on('collect', handleAction);

        collector.on('end', async (_, reason) => {
            if (reason === 'time') {
                await response.edit({
                    components: []
                }).catch(() => {});
            }
        });
    },
};

export default addAltAccountCommand;
