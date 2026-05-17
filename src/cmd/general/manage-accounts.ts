import { Command } from '@/bot/command.ts';
import { CommandFlags } from '@/bot/apis/commands/misc.ts';
import { CommandPermissions } from '@/bot/apis/commands/permissions.ts';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.ts';
import { PredefinedColors } from '@/util/color.ts';
import { client } from '@/client.ts';
import logError from '@/util/log-error.ts';
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ComponentType, StringSelectMenuBuilder, StringSelectMenuInteraction } from 'discord.js';
import { db } from '@/bot/apis/db/bot-db.ts';
import { addLvlRole, xpToLevel } from '@/bot/level.ts';
import User from '@/bot/apis/db/user.ts';

function getMainAccount(id: string) {
    try {
        return client.users.fetch(id);
    } catch { 
        return null;
    }
}

const manageAccountsCmd: Command = {
    name: 'manage-accounts',
    aliases: ['account'],

    description: {
        main: 'Zarządzaj swoimi wszystkimi kontami połączonymi w EclairBocie.',
        short: 'Zarządzaj swoimi multikontami.'
    },
    expectedArgs: [],

    flags: CommandFlags.Unsafe,
    permissions: CommandPermissions.everyone(),

    async execute(api) {
        const alternative_accounts = (await Promise.all(
            (await api.executor.fetchAlternativeAccounts())
                .map(async (id) => { try { return await client.users.fetch(id); } catch (e) { logError('stdwarn', e, 'Alternative account fetching'); return null; } })
        )).filter((u) => u !== null);
        const main_account = await getMainAccount(api.executor.id);

        if (alternative_accounts.length == 0) {
            return api.log.replyWarn(api, 'Nie masz tu altów', 'Nie możesz zbytnio zarządzać swoimi multikontami, gdy ich nie masz. Dodaj pierwsze za pomocą koemndy `sudo add-primary-account @twoje-główne-konto`, wywołanej z twojego alta.');
        }

        const msg = await api.reply({
            embeds: [
                new ReplyEmbed()
                    .setColor(PredefinedColors.Aqua)
                    .setTitle('🦾 Twoja grupa kont')
                    .setDescription([
                        'Oto wszystkie konta, które połączyłeś w naszym rewolucyjnym bocie. Współdzielisz pomiędzy nimi pieniądze na ekonomii, poziom i dużo różnego rodzaju stanu.',
                        '',
                        `**Główne konto:** \`${main_account?.username ?? 'nieznane'}\``,
                        `**Twoje multikonta:** \`${alternative_accounts.map((a) => a.username).join('`, `')}\``
                    ].join('\n'))
                    .setThumbnail(main_account?.displayAvatarURL() ?? client.user!.displayAvatarURL())
            ],
            components: [
                new ActionRowBuilder<ButtonBuilder>()
                    .addComponents([
                        new ButtonBuilder()
                            .setCustomId('move-primary')
                            .setStyle(ButtonStyle.Primary)
                            .setLabel('Zmień główne konto'),
                        new ButtonBuilder()
                            .setCustomId('leave-group')
                            .setStyle(ButtonStyle.Danger)
                            .setLabel('Opuść grupę')
                    ])
            ]
        }); 

        const filter = (i: ButtonInteraction | StringSelectMenuInteraction) => [...alternative_accounts, main_account].filter(Boolean).map(u => u!.id).includes(i.user.id);
        const collector = msg.createMessageComponentCollector<ComponentType.Button | ComponentType.StringSelect>({ filter, time: 90000 });
        
        collector.on('collect', async (i) => {
            i.deferUpdate();

            if (i.customId == 'leave-group' && i.isButton()) {
                if (api.executor.id == i.user.id) {
                    return await msg.edit({ embeds: [ 
                        api.log.getErrorEmbed('Masz problem', 'Jako główne konto nie możesz opuścić grupy multikont. Najpierw musisz przenieść tę pozycję na inne konto.') 
                    ], components: [] })
                }

                await msg.edit({
                    embeds: [
                        api.log.getWarnEmbed('Zamierzasz zresetować cały swój progress!', `Kiedy dodałeś te konto jako alta użytkownika <@${main_account?.id}>, nieodwracalnie przekazałeś cały swój progress na rzecz tego konta. **Jeżeli teraz opuścisz grupę, stracisz dostęp do Twojego postępu i będziesz musiał zaczynać od nowa**. Czy na pewno chcesz to zrobić?`)
                    ],
                    components: [
                        new ActionRowBuilder<ButtonBuilder>()
                            .addComponents([
                                new ButtonBuilder()
                                    .setCustomId('leave-group-final')
                                    .setStyle(ButtonStyle.Danger)
                                    .setLabel('Potwierdź'),
                                new ButtonBuilder()
                                    .setCustomId('cancel')
                                    .setStyle(ButtonStyle.Secondary)
                                    .setLabel('Anuluj')
                            ])
                    ]
                }) 
            } else if (i.customId == 'leave-group-final' && i.isButton()) {
                db.runSql("DELETE FROM alternative_accounts WHERE alternative_account = ?", [i.user.id]);

                // very scary
                db.reset.all(i.user.id);
                addLvlRole(i.guild!, 1, i.user.id);

                return await msg.edit({
                    embeds: [ api.log.getSuccessEmbed('Proszę bardzo', `Pomyślnie opuściłeś grupę. Nie jesteś już uznawany za alta użytkownika <@${main_account?.id}>`) ],
                    components: []
                });
            } else if (i.customId == 'move-primary' && i.isButton()) {
                return await msg.edit({
                    embeds: [
                        api.log.getTipEmbed('Wybierz konto', 'Musisz wybrać konto, które stanie się Twoim nowym głównym kontem. Zrób to, wybierając je z listy poniżej.')
                    ],
                    components: [
                        new ActionRowBuilder<StringSelectMenuBuilder>()
                            .addComponents([
                                new StringSelectMenuBuilder()
                                    .setPlaceholder('Wybierz konto')
                                    .setCustomId('move-primary-selected')
                                    .setOptions(alternative_accounts.map((ac) => { return { label: ac.displayName, description: `${ac.username} (id: ${ac.id})`, value: ac.id }; }))       
                            ])
                    ]
                });                
            } else if (i.customId == 'cancel' && i.isButton()) {
                return await msg.edit({
                    embeds: [ api.log.getWarnEmbed('Anulowano', 'Operacja nie została zfinalizowana.') ],
                    components: []
                });
            } else if (i.customId == 'move-primary-selected' && i.isStringSelectMenu()) { 
                db.transaction(async () => {
                    const old_primary = api.executor;
                    
                    // removing records
                    db.runSql("UPDATE alternative_accounts SET primary_account = ? WHERE primary_account = ?", [ i.values[0], old_primary.id ]);
                    db.runSql("UPDATE alternative_accounts SET alternative_account = ? WHERE primary_account = ? AND alternative_account = ?", [ old_primary.id, i.values[0], i.values[0] ]);

                    const new_primary = new User(i.values[0]);

                    // updating data 
                    await new_primary.leveling.addXP(await old_primary.leveling.getXP());
                    await addLvlRole(api.guild!, xpToLevel(await new_primary.leveling.getXP()), i.user.id);
                    const economy_balance = await old_primary.economy.getBalance();
                    new_primary.economy.addBankMoney(economy_balance.bank.add(economy_balance.wallet));

                    // very scary 
                    await db.reset.all(old_primary.id);
                });

                await msg.edit({
                    embeds: [ api.log.getSuccessEmbed("Przeniesiono.", `Od teraz to ${i.values[0]} jest Twoim głównym kontem.`) ],
                    components: []
                });
            }
        })

        collector.on('end', async (_, reason) => {
            if (reason === 'time') {
                await msg.edit({
                    components: [],
                }).catch(() => {});
            }
        });
    },
};

export default manageAccountsCmd;
