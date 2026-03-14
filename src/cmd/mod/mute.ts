import * as dsc from 'discord.js';
import { output } from '@/bot/logging.js';

import { Command} from "@/bot/command.js";
import { CommandFlags } from '@/bot/apis/commands/misc.js';
import { cfg } from '@/bot/cfg.js';
import { PredefinedColors } from '@/util/color.js';
import { Hour, Timestamp } from '@/util/parseTimestamp.js';

import mute from '@/bot/apis/mod/muting.js';
import { watchMute } from '@/bot/watchdog.js';
import { sendLog } from '@/bot/apis/log/send-log.js';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.js';

const cmdCfg = cfg.commands.configuration.mute;

export const muteCmd: Command = {
    name: 'mute',
    aliases: cmdCfg.aliases,
    description: {
        main: 'Zamykam Ci buzię na czacie, żebyś mógł w ciszy przemyśleć swoje wybory życiowe. Jak chcesz pogadać, to poczekaj, aż Cię ktoś od muteuje.',
        short: 'Zamyka morde podanemu użytkownikowi'
    },
    flags: CommandFlags.Important,

    expectedArgs: [
        {
            name: 'user',
            description: 'No ten, tu podaj użytkownika którego chcesz zmuteowac',
            type: { base: 'user-mention', includeRefMessageAuthor: true },
            optional: false,
        },
        {
            name: 'duration',
            description: 'Długość mute, domyślnie 24h',
            type: { base: 'timestamp' },
            optional: true,
        },
        {
            name: 'reason',
            description: 'Powód wyciszenia użytkownika',
            type: { base: 'string', trailing: true },
            optional: !cmdCfg.reasonRequired,
        },
    ],
    permissions: {
        allowedRoles: cmdCfg.allowedRoles,
        allowedUsers: cmdCfg.allowedUsers,
    },

    async execute(api) {
        const targetUser = api.getTypedArg('user', 'user-mention')?.value as dsc.GuildMember;
        let reason = api.getTypedArg('reason', 'string')?.value as string;
        const duration = api.getTypedArg('duration', 'timestamp')?.value as Timestamp | null ?? 24 * Hour;
        let expiresAt = duration != null ? Math.floor(Date.now() / 1000) + duration : null;

        if (!targetUser) {
            return api.log.replyError(api, 'Nie podano celu', 'Kolego co ty myślisz że ja się sam domyślę, komu ty to chcesz zrobić? Zgadłeś - nie domyślę się. Więc bądź tak miły i podaj użytkownika, dla którego odpalasz tą komendę.');
        }

        if (!reason && cmdCfg.reasonRequired) {
            return api.log.replyError(api, 'Musisz podać powód!', 'Bratku... dlaczego ty chcesz to zrobić? Możesz mi chociaż powiedzieć, a nie wysuwać pochopne wnioski i banować/warnować/mute\'ować ludzi bez powodu?');
        } else if (!reason) {
            reason = 'Moderator nie poszczycił się znajomością komendy i nie podał powodu... Ale moze to i lepiej...';
        }

        try {
            if (api.invoker.member) watchMute(api.invoker.member!);
            await mute(targetUser, { reason, duration: (duration ?? 1) * 1000 });

            sendLog({
                color: PredefinedColors.Purple,
                title: 'Nałożono kłódkę na buzię',
                description: `Użytkownik <@${targetUser.id}> został wyciszony na 24 godziny przez <@${api.invoker.id}>.`,
                fields: [{ name: 'Powód', value: reason }]
            });

            return api.reply({
                embeds: [
                    new ReplyEmbed()
                        .setTitle(`📢 Na ${targetUser.user.username} przymusowo nałożono kłódkę na buzię!`)
                        .setDescription(`Ciekawe czy wyjdzie z serwera... A, racja! Mogłem tego nie mówić.`)
                        .addFields(
                            { name: 'Moderator', value: `<@${api.invoker.id}>`, inline: true },
                            { name: 'Użytkownik', value: `<@${targetUser.id}>`, inline: true },

                            { name: 'Powód', value: reason, inline: false },
                            { name: 'Czas', value:`<t:${expiresAt}:R>`, inline: true },
                        )
                        .setColor(PredefinedColors.Orange)
                ]
            });
        } catch (err) {
            output.err(err);
            return api.log.replyError(api, 'Brak permisji', 'Coś Ty Eklerka znowu pozmieniał? No chyba że mutujesz admina...');
        }
    }
};
