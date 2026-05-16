import { Command } from '@/bot/command.ts';
import { CommandFlags } from '@/bot/apis/commands/misc.ts';
import { CommandPermissions } from '@/bot/apis/commands/permissions.ts';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.ts';
import { PredefinedColors } from '@/util/color.ts';
import { client } from '@/client.ts';
import logError from '@/util/log-error.ts';
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ComponentType, StringSelectMenuBuilder, StringSelectMenuInteraction } from 'discord.js';
import { db } from '@/bot/apis/db/bot-db.ts';
import { addLvlRole } from '@/bot/level.ts';

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
                await msg.edit({
                    embeds: [ api.log.getErrorEmbed('Work in progress...', `Niestety, zmienianie głównego konta nie jest jeszcze dostępne. Z racji iż aktualnie nie chce mi się chrzanić z SQLite, odkładam zrobienie tego na później. Aktualnie aby to zrobić, możesz opuścić grupę ze wszystkich swoich altów a następnie na starym primary wywołać komendę add-primary-account na nowe konto.`) ],
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
