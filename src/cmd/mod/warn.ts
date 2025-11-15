import { Command, CommandFlags } from '@/bot/command.js';
import { PredefinedColors } from '@/util/color.js';
import { cfg } from '@/bot/cfg.js';

import * as log from '@/util/log.js';
import * as dsc from 'discord.js';
import {output as debug} from '@/bot/logging.js';

import warn from '@/bot/apis/mod/warns.js';
import parseTimestamp, { Timestamp } from '@/util/parseTimestamp.js';
import clamp from '@/util/math/clamp.js';

export const warnCmd: Command = {
    name: 'warn',
    aliases: cfg.commands.mod.warn.aliases,
    description: {
        main: 'Daj komuś warna, by go onieśmielić, uciszyć, zamknąć mu morde i nadużyć władzy. Żart, ale nie nadużywaj bo to się źle skończy... Nie wiesz z czym zadzierasz przybyszu!',
        short: 'Warnuje podaną osobę'
    },
    flags: CommandFlags.Important,

    expectedArgs: [
        {
            name: 'user',
            description: 'No ten, tu podaj użytkownika którego chcesz zwarnować',
            type: 'user-mention-or-reference-msg-author',
            optional: false,
        },
        {
            name: 'points',
            description: `Tu ile warn-pointsów chcesz dać, domyślnie 1 i raczej tego nie zmieniaj. No i ten, maksymalnie możesz dać ${cfg.commands.mod.warn.maxPoints}`,
            type: 'number',
            optional: true,
        },
        {
            name: 'duration',
            description: 'Czas po jakim warn wygaśnie',
            type: 'timestamp',
            optional: true,
        },
        {
            name: 'reason',
            description: cfg.commands.mod.warn.reasonRequired
                ? 'Po prostu powód warna'
                : 'Po prostu powód warna. Możesz go pominąć ale nie polecam',
            type: 'trailing-string',
            optional: !cfg.commands.mod.warn.reasonRequired,
        }
    ],

    permissions: {
        discordPerms: null,
        allowedRoles: cfg.commands.mod.warn.allowedRoles,
        allowedUsers: cfg.commands.mod.warn.allowedUsers
    },

    async execute(api) {
        let targetUser = api.getTypedArg('user', 'user-mention-or-reference-msg-author')?.value as dsc.GuildMember | undefined;
        let points = api.getTypedArg('points', 'number')?.value as number ?? 1;
        let reason = api.getTypedArg('reason', 'trailing-string')?.value as string ?? '';
        const duration = api.getTypedArg('duration', 'timestamp')?.value as Timestamp | null;
        let expiresAt = duration != null ? Math.floor(Date.now() / 1000) + duration : null;

        debug.log('Warn command args:', { targetUser, points, reason });

        if (!targetUser) {
            return api.log.replyError(
                api.msg,
                cfg.customization.modTexts.noTargetSpecifiedHeader,
                cfg.customization.modTexts.noTargetSpecifiedText
            );
        }

        if (targetUser.roles.cache.hasAny(...cfg.features.moderation.protectedRoles)) {
            return api.log.replyError(api.msg, cfg.customization.modTexts.userIsProtectedHeader, cfg.customization.modTexts.userIsProtectedDesc);
        }

        if (!reason) {
            if (cfg.commands.mod.warn.reasonRequired) {
                return api.log.replyError(api.msg, cfg.customization.modTexts.reasonRequiredNotSpecifiedHeader, cfg.customization.modTexts.reasonRequiredNotSpecifiedText);
            } else {
                reason = cfg.customization.modTexts.defaultReason;
            }
        }

        if (targetUser.id === api.msg.author.id) {
            return api.log.replyError(
                api.msg,
                cfg.customization.modTexts.havingMentalProblemsByWarningYourselfHeader,
                cfg.customization.modTexts.havingMentalProblemsByWarningYourselfText,
            );
        }

        points = clamp(cfg.commands.mod.warn.minPoints, points, cfg.commands.mod.warn.maxPoints);

        if (targetUser.id === api.msg.author.plainUser.client.user?.id) {
            points = 2;
            reason = cfg.customization.modTexts.warningEclairBotReason;
            targetUser = api.msg.member!.plainMember;
        }

        if (targetUser.id === '1409902422108934226') {
            points = 2;
            reason = cfg.customization.modTexts.warningWatchdogReason;
            targetUser = api.msg.member!.plainMember;
        }

        try {
            await warn(targetUser, {
                reason,
                expiresAt: expiresAt ?? null,
                points,
                mod: api.msg.author.id
            });
        } catch (err) {
            debug.err(err);
            return api.log.replyError(api.msg, 'Błąd bazy danych', 'Nie udało się zapisać warna');
        }

        const embed = new dsc.EmbedBuilder()
            .setTitle(`📢 ${cfg.customization.modTexts.warnHeader.replace('<mention>', targetUser.user.username)}`)
            .setDescription(cfg.customization.modTexts.warnDescription.replace('<points>', `${points}`))
            .addFields(
                { name: 'Moderator', value: `<@${api.msg.author.id}>`, inline: true },
                { name: 'Użytkownik', value: `<@${targetUser.id}>`, inline: true },
                { name: 'Powód', value: reason, inline: false },
                { name: 'Punkty', value: points.toString(), inline: true },
            )
            .setColor(PredefinedColors.Orange);

        if (duration) {
            embed.addFields({ name: 'Wygasa', value: `<t:${expiresAt}:R>`, inline: false });
        }

        await api.reply({ embeds: [embed] });
    }
};
