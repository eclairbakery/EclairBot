import * as dsc from 'discord.js';
import {output as debug} from '@/bot/logging.ts';

import { Command} from "@/bot/command.ts";
import { CommandFlags } from '@/bot/apis/commands/misc.ts';
import { CommandPermissions } from '@/bot/apis/commands/permissions.ts';
import { CommandAPI } from '@/bot/apis/commands/api.ts';
import { cfg } from '@/bot/cfg.ts';
import { PredefinedColors } from '@/util/color.ts';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.ts';

import ban from '@/bot/apis/mod/bans.ts';

const cmdCfg = cfg.commands.configuration.ban;

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
        const reason = reasonArg?.trim() || (cmdCfg.reasonRequired ? null : 'Moderator nie poszczycił się znajomością komendy i nie podał powodu... Ale moze to i lepiej...');

        if (!targetUser) {
            return api.log.replyError(api, 'Nie podano celu', 'Kolego co ty myślisz że ja się sam domyślę, komu ty to chcesz zrobić? Zgadłeś - nie domyślę się. Więc bądź tak miły i podaj użytkownika, dla którego odpalasz tą komendę.');
        }

        if (!reason) {
            return api.log.replyError(api, 'Musisz podać powód!', 'Bratku... dlaczego ty chcesz to zrobić? Możesz mi chociaż powiedzieć, a nie wysuwać pochopne wnioski i banować/warnować/mute\'ować ludzi bez powodu?');
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
