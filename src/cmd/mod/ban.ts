import * as dsc from 'discord.js';
import {output as debug} from '@/bot/logging.js';

import { Command, CommandAPI, CommandFlags, CommandPermissions } from '@/bot/command.js';
import { cfg } from '@/bot/cfg.js';
import { PredefinedColors } from '@/util/color.js';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.js';

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
            type: { base: 'user-mention', includeRefMessageAuthor: true },
            optional: false,
        },
        {
            name: 'reason',
            description: 'Powód bana',
            type: { base: 'string', trailing: true },
            optional: !cmdCfg.reasonRequired,
        }
    ],
    permissions: CommandPermissions.fromCommandConfig(cmdCfg),

    execute: async (api: CommandAPI) => {
        const targetUser = api.getTypedArg('user', 'user-mention').value as dsc.GuildMember;
        const reasonArg = api.getTypedArg('reason', 'string').value as string;
        const reason = reasonArg?.trim() || (cmdCfg.reasonRequired ? null : cfg.customization.modTexts.defaultReason);

        if (!targetUser) {
            return api.log.replyError(api, cfg.customization.modTexts.noTargetSpecifiedHeader, cfg.customization.modTexts.noTargetSpecifiedText);
        }

        if (!reason) {
            return api.log.replyError(api, cfg.customization.modTexts.reasonRequiredNotSpecifiedHeader, cfg.customization.modTexts.reasonRequiredNotSpecifiedText);
        }

        if (targetUser.roles.cache.hasAny(...cfg.features.moderation.protectedRoles)) {
            return api.log.replyError(api, cfg.customization.modTexts.userIsProtectedHeader, cfg.customization.modTexts.userIsProtectedDesc);
        }

        try {
            await ban(targetUser, { reason, mod: api.invoker.id });

            await api.reply({
                embeds: [
                    new ReplyEmbed()
                        .setTitle(`📢 ${targetUser.user.username} został zbanowany!`)
                        .setDescription(`Multikonto? Już po nim... Wkurzający chłop? Uciszony na zawsze... Ktokolwiek? Nie może wbić, chyba że zrobi alta...`)
                        .addFields(
                            { name: 'Moderator', value: `<@${api.invoker.id}>`, inline: true },
                            { name: 'Użytkownik', value: `<@${targetUser.id}>`, inline: true },
                            { name: 'Powód', value: reason, inline: false }
                        )
                        .setColor(PredefinedColors.Orange)
                ]
            });
        } catch (err) {
            debug.err(err);
            return api.log.replyError(api, 'Brak permisji', 'Coś Ty Eklerka znowu pozmieniał? No chyba że banujesz admina...');
        }
    }
};
