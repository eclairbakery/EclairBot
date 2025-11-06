import * as dsc from 'discord.js';
import * as log from '@/util/log.js';
import {output as debug} from '@/bot/logging.js';

import { Command, CommandAPI, CommandFlags } from '@/bot/command.js';
import { cfg } from '@/bot/cfg.js';
import { PredefinedColors } from '@/util/color.js';
import { Hour, Timestamp } from '@/util/parseTimestamp.js';

import mute from '@/bot/apis/mod/muting.js';

const cmdCfg = cfg.commands.mod.mute;

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
            type: 'user-mention-or-reference-msg-author',
            optional: false,
        },
        {
            name: 'duration',
            description: 'Długość mute, domyślnie 24h',
            type: 'timestamp',
            optional: true,
        },
        {
            name: 'reason',
            description: 'Powód wyciszenia użytkownika',
            type: 'trailing-string',
            optional: !cmdCfg.reasonRequired,
        },
    ],
    permissions: {
        discordPerms: null,
        allowedRoles: cmdCfg.allowedRoles,
        allowedUsers: cmdCfg.allowedUsers,
    },

    async execute(api) {
        const targetUser = api.getTypedArg('user', 'user-mention-or-reference-msg-author')?.value as dsc.GuildMember;
        let reason = api.getTypedArg('reason', 'trailing-string')?.value as string;
        const duration = api.getTypedArg('duration', 'timestamp')?.value as Timestamp | null ?? 24 * Hour;
        let expiresAt = duration != null ? Math.floor(Date.now() / 1000) + duration : null;

        if (!targetUser) {
            return log.replyError(api.msg, cfg.customization.modTexts.noTargetSpecifiedHeader, cfg.customization.modTexts.noTargetSpecifiedText);
        }

        if (!reason && cmdCfg.reasonRequired) {
            return log.replyError(api.msg, cfg.customization.modTexts.reasonRequiredNotSpecifiedHeader, cfg.customization.modTexts.reasonRequiredNotSpecifiedText);
        } else if (!reason) {
            reason = cfg.customization.modTexts.defaultReason;
        }

        if (targetUser.roles.cache.hasAny(...cfg.general.moderationProtectedRoles)) {
            return log.replyError(api.msg, cfg.customization.modTexts.userIsProtectedHeader, cfg.customization.modTexts.userIsProtectedDesc);
        }

        try {
            await mute(targetUser, { reason, duration });

            const role = api.msg.guild?.roles.cache.find(r => r.name.toLowerCase().includes("zamknij ryj"));
            if (role != undefined) await targetUser.roles.add(role, reason);

            const logChannel = await api.msg.channel.client.channels.fetch(cfg.logs.channel);
            if (logChannel != null && logChannel.isSendable()) {
                logChannel.send({
                    embeds: [
                        new dsc.EmbedBuilder()
                            .setAuthor({ name: 'EclairBOT' })
                            .setColor(PredefinedColors.Purple)
                            .setTitle('Nałożono kłódkę na buzię')
                            .setDescription(`Użytkownik <@${targetUser.id}> został wyciszony na 24 godziny przez <@${api.msg.author.id}>.`)
                            .addFields([{ name: 'Powód', value: reason }])
                    ]
                });
            }

            return api.reply({
                embeds: [
                    new dsc.EmbedBuilder()
                        .setTitle(`📢 Na ${targetUser.user.username} przymusowo nałożono kłódkę na buzię!`)
                        .setDescription(`Ciekawe czy wyjdzie z serwera... A, racja! Mogłem tego nie mówić.`)
                        .addFields(
                            { name: 'Moderator', value: `<@${api.msg.author.id}>`, inline: true },
                            { name: 'Użytkownik', value: `<@${targetUser.id}>`, inline: true },

                            { name: 'Powód', value: reason, inline: false },
                            { name: 'Czas', value:`<t:${expiresAt}:R>`, inline: true },
                        )
                        .setColor(PredefinedColors.Orange)
                ]
            });
        } catch (err) {
            debug.err(err);
            return log.replyError(api.msg, 'Brak permisji', 'Coś Ty Eklerka znowu pozmieniał? No chyba że mutujesz admina...');
        }
    }
};
