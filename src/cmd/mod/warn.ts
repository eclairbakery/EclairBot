import { Command, CommandFlags, CommandPermissions } from '@/bot/command.js';
import { PredefinedColors } from '@/util/color.js';
import { cfg } from '@/bot/cfg.js';

import * as dsc from 'discord.js';
import { output } from '@/bot/logging.js';

import warn from '@/bot/apis/mod/warns.js';
import parseTimestamp, { Timestamp } from '@/util/parseTimestamp.js';
import clamp from '@/util/math/clamp.js';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.js';

export const warnCmd: Command = {
    name: 'warn',
    aliases: cfg.legacy.commands.mod.warn.aliases,
    description: {
        main: 'Daj komuś warna, by go onieśmielić, uciszyć, zamknąć mu morde i nadużyć władzy. Żart, ale nie nadużywaj bo to się źle skończy... Nie wiesz z czym zadzierasz przybyszu!',
        short: 'Warnuje podaną osobę'
    },
    flags: CommandFlags.Important,

    expectedArgs: [
        {
            name: 'user',
            description: 'No ten, tu podaj użytkownika którego chcesz zwarnować',
            type: { base: 'user-mention', includeRefMessageAuthor: true },
            optional: false,
        },
        {
            name: 'points',
            description: `Tu ile warn-pointsów chcesz dać, domyślnie 1 i raczej tego nie zmieniaj. No i ten, maksymalnie możesz dać ${cfg.legacy.commands.mod.warn.maxPoints}`,
            type: { base: 'float' },
            optional: true,
        },
        {
            name: 'duration',
            description: 'Czas po jakim warn wygaśnie',
            type: { base: 'timestamp' },
            optional: true,
        },
        {
            name: 'reason',
            description: cfg.legacy.commands.mod.warn.reasonRequired
                ? 'Po prostu powód warna'
                : 'Po prostu powód warna. Możesz go pominąć ale nie polecam',
            type: { base: 'string', trailing: true },
            optional: !cfg.legacy.commands.mod.warn.reasonRequired,
        }
    ],

    permissions: CommandPermissions.fromCommandConfig(cfg.legacy.commands.mod.warn),

    async execute(api) {
        let targetUser = api.getTypedArg('user', 'user-mention')?.value as dsc.GuildMember | undefined;
        let points = api.getTypedArg('points', 'float')?.value as number ?? 1;
        let reason = api.getTypedArg('reason', 'string')?.value as string ?? '';
        const duration = api.getTypedArg('duration', 'timestamp')?.value as Timestamp | null;
        let expiresAt = (duration != null ? Math.floor(Date.now() / 1000) + duration : null) ?? (Math.floor(Date.now() / 1000) + parseTimestamp('24h')!);

        output.log('Warn command args:', { targetUser, points, reason });

        if (!targetUser) {
            return api.log.replyError(
                api,
                cfg.legacy.customization.modTexts.noTargetSpecifiedHeader,
                cfg.legacy.customization.modTexts.noTargetSpecifiedText
            );
        }

        if (targetUser.roles.cache.hasAny(...cfg.legacy.features.moderation.protectedRoles)) {
            return api.log.replyError(api, cfg.legacy.customization.modTexts.userIsProtectedHeader, cfg.legacy.customization.modTexts.userIsProtectedDesc);
        }

        if (!reason) {
            if (cfg.legacy.commands.mod.warn.reasonRequired) {
                return api.log.replyError(api, cfg.legacy.customization.modTexts.reasonRequiredNotSpecifiedHeader, cfg.legacy.customization.modTexts.reasonRequiredNotSpecifiedText);
            } else {
                reason = cfg.legacy.customization.modTexts.defaultReason;
            }
        }

        if (targetUser.id === api.invoker.id) {
            return api.log.replyError(
                api,
                cfg.legacy.customization.modTexts.havingMentalProblemsByWarningYourselfHeader,
                cfg.legacy.customization.modTexts.havingMentalProblemsByWarningYourselfText,
            );
        }

        points = clamp(cfg.legacy.commands.mod.warn.minPoints, points, cfg.legacy.commands.mod.warn.maxPoints);

        if (targetUser.id === api.invoker.user.client.user?.id) {
            points = 2;
            reason = cfg.legacy.customization.modTexts.warningEclairBotReason;
            targetUser = api.invoker.member!;
        }

        try {
            await warn(targetUser, {
                reason,
                expiresAt: expiresAt ?? null,
                points,
                mod: api.invoker.id
            });
        } catch (err) {
            output.err(err);
            return api.log.replyError(api, 'Błąd bazy danych', 'Nie udało się zapisać warna');
        }

        if (!api.preferShortenedEmbeds) {

        const embed = new ReplyEmbed()
            .setTitle(`📢 ${cfg.legacy.customization.modTexts.warnHeader.replace('<mention>', targetUser.user.username).replace('<mod>', api.invoker.user.username)}`)
            .setDescription(cfg.legacy.customization.modTexts.warnDescription.replace('<points>', `${points}`).replace('<duration>', `<t:${expiresAt}:R>`))
            .setColor(PredefinedColors.Orange);

        await api.reply({ embeds: [embed] });

        } else {

        await api.reply({
            embeds: [
                new ReplyEmbed()
                    .setTitle('📢 Użytkownik dostał warna')
                    .setColor(PredefinedColors.Orange)
                    .setDescription(`Udało się. To tyle. Więcej na <#${cfg.legacy.channels.mod.warnings}>`)
            ]
        });

        }
    }
};
