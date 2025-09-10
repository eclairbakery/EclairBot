import { Command, CommandAPI } from '@/bot/command.js';
import { cfg } from '@/bot/cfg.js';
import * as dsc from 'discord.js';
import { PredefinedColors } from '@/util/color.js';
import * as log from '@/util/log.js';
import ban from '@/bot/apis/bans.js';

const cmdCfg = cfg.mod.commands.ban;

export const banCmd: Command = {
    name: 'ban',
    description: {
        main: 'Jak masz uprawnienia, no to banuj ludzi. Taka praca... A jak nie, to nawet nie próbuj tego tykać!',
        short: 'Banuje danego użytkownika z serwera'
    },
    expectedArgs: [
        { name: 'user', type: 'user-mention', optional: false, description: 'Osoba, która jest nieznośna idzie do tego pola...' },
        { name: 'reason', type: 'trailing-string', optional: !cmdCfg.reasonRequired, description: 'Powód bana' }
    ],
    aliases: cmdCfg.aliases,
    permissions: {
        discordPerms: null,
        allowedRoles: cmdCfg.allowedRoles,
        allowedUsers: cmdCfg.allowedUsers
    },
    execute: async (api: CommandAPI) => {
        const targetUser = api.getTypedArg('user', 'user-mention').value as dsc.GuildMember;
        const reasonArg = api.getTypedArg('reason', 'trailing-string').value as string;
        const reason = reasonArg?.trim() || (cmdCfg.reasonRequired ? null : 'Moderator nie podał powodu.');

        if (!targetUser) {
            return log.replyError(api.msg, 'Nie podano celu', 'Kolego, myślisz że ja sie sam domyśle komu ty chcesz dać bana? Użycie: odpowiedzi na wiadomość lub !ban <@user> <powód>');
        }

        if (!reason) {
            return log.replyError(api.msg, 'Nie podano powodu', 'Ale za co ten ban? Poproszę o doprecyzowanie!');
        }

        if (targetUser.roles.cache.hasAny(...cfg.general.moderationProtectedRoles)) {
            return log.replyError(api.msg, 'Chronimy go!', 'Użytkownik poprosił o ochronę i ją dostał!');
        }

        try {
            try {
                await targetUser.send({
                    embeds: [
                        new dsc.EmbedBuilder()
                            .setTitle('📢 Zostałeś zbanowany z serwera Piekarnia eklerki!')
                            .setDescription(`To straszne wiem. Powód bana brzmi: ${reason}`)
                            .setColor(PredefinedColors.Orange)
                    ]
                });
            } catch {}

            await ban(targetUser, { reason });

            await api.msg.reply({
                embeds: [
                    new dsc.EmbedBuilder()
                        .setTitle(`📢 ${targetUser.user.username} został zbanowany!`)
                        .setDescription(`Multikonto? Już po nim... Wkurzający chłop? Uciszony na zawsze... Ktokolwiek? Nie może wbić, chyba że zrobi alta...`)
                        .addFields(
                            { name: 'Moderator', value: `<@${api.msg.author.id}>`, inline: true },
                            { name: 'Użytkownik', value: `<@${targetUser.id}>`, inline: true },
                            { name: 'Powód', value: reason, inline: false }
                        )
                        .setColor(PredefinedColors.Orange)
                ]
            });

            const logChannel = await api.msg.channel.client.channels.fetch(cfg.logs.channel);
            if (logChannel?.isSendable()) {
                return logChannel.send({
                    embeds: [
                        new dsc.EmbedBuilder()
                            .setAuthor({ name: 'EclairBOT' })
                            .setColor(PredefinedColors.DarkGrey)
                            .setTitle('Zbanowano członka')
                            .setDescription(`Użytkownik <@${targetUser.id}> (${targetUser.user.username}) został zbanowany z serwera przez <@${api.msg.author.id}>!`)
                            .addFields([{ name: 'Powód', value: reason }])
                    ]
                });
            }
        } catch (e) {
            console.error(e);
            return log.replyError(api.msg, 'Brak permisji', 'Coś Ty Eklerka znowu pozmieniał? No chyba że banujesz admina...');
        }
    }
};