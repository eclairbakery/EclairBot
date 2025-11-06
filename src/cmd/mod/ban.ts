import * as log from '@/util/log.js';
import * as dsc from 'discord.js';
import {output as debug} from '@/bot/logging.js';

import { Command, CommandAPI, CommandFlags } from '@/bot/command.js';
import { cfg } from '@/bot/cfg.js';
import { PredefinedColors } from '@/util/color.js';
import ban from '@/bot/apis/mod/bans.js';

const cmdCfg = cfg.commands.mod.ban;

export const banCmd: Command = {
    name: 'ban',
    aliases: cmdCfg.aliases,
    description: {
        main: 'Jak masz uprawnienia, no to banuj ludzi. Taka praca... A jak nie, to nawet nie próbuj tego tykać!',
        short: 'Banuje danego użytkownika z serwera'
    },
    flags: CommandFlags.Important,

    expectedArgs: [
        {
            name: 'user',
            description: 'Osoba, która jest nieznośna idzie do tego pola...',
            type: 'user-mention-or-reference-msg-author',
            optional: false,
        },
        {
            name: 'reason',
            description: 'Powód bana',
            type: 'trailing-string',
            optional: !cmdCfg.reasonRequired,
        }
    ],
    permissions: {
        discordPerms: null,
        allowedRoles: cmdCfg.allowedRoles,
        allowedUsers: cmdCfg.allowedUsers
    },
    execute: async (api: CommandAPI) => {
        const targetUser = api.getTypedArg('user', 'user-mention-or-reference-msg-author').value as dsc.GuildMember;
        const reasonArg = api.getTypedArg('reason', 'trailing-string').value as string;
        const reason = reasonArg?.trim() || (cmdCfg.reasonRequired ? null : cfg.customization.modTexts.defaultReason);

        if (!targetUser) {
            return api.log.replyError(api.msg, cfg.customization.modTexts.noTargetSpecifiedHeader, cfg.customization.modTexts.noTargetSpecifiedText);
        }

        if (!reason) {
            return api.log.replyError(api.msg, cfg.customization.modTexts.reasonRequiredNotSpecifiedHeader, cfg.customization.modTexts.reasonRequiredNotSpecifiedText);
        }

        if (targetUser.roles.cache.hasAny(...cfg.general.moderationProtectedRoles)) {
            return api.log.replyError(api.msg, cfg.customization.modTexts.userIsProtectedHeader, cfg.customization.modTexts.userIsProtectedDesc);
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

            await api.reply({
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
        } catch (err) {
            debug.err(err);
            return api.log.replyError(api.msg, 'Brak permisji', 'Coś Ty Eklerka znowu pozmieniał? No chyba że banujesz admina...');
        }
    }
};
