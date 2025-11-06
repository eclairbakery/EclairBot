import clamp from '@/util/clamp.js';
import parseTimestamp from '@/util/parseTimestamp.js';

import { Command, CommandFlags } from '@/bot/command.js';
import { PredefinedColors } from '@/util/color.js';
import { cfg } from '@/bot/cfg.js';

import * as log from '@/util/log.js';
import * as dsc from 'discord.js';

export const shitwarnCmd: Command = {
    name: 'shitwarn',
    aliases: cfg.commands.mod.warn.aliases,
    description: {
        main: 'Lubisz warnować? Świetnie! Ta komenda daje fake-warny!',
        short: 'Ta komenda daje fake-warny!'
    },
    flags: CommandFlags.Important,

    expectedArgs: [
        {
            name: 'user',
            type: 'user-mention-or-reference-msg-author',
            description: 'No ten, tu podaj użytkownika którego chcesz zwarnować',
            optional: false
        },
        {
            name: 'points',
            type: 'number',
            description: `Tu ile warn-pointsów chcesz dać, domyślnie 1 i raczej tego nie zmieniaj. No i ten, maksymalnie możesz dać ${cfg.commands.mod.warn.maxPoints}`,
            optional: true
        },
        {
            name: 'reason',
            type: 'trailing-string',
            description: cfg.commands.mod.warn.reasonRequired
                ? 'Po prostu powód warna'
                : 'Po prostu powód warna. Możesz go pominąć ale nie polecam',
            optional: !cfg.commands.mod.warn.reasonRequired
        }
    ],

    permissions: {
        discordPerms: null,
        allowedRoles: cfg.commands.mod.warn.allowedRoles,
        allowedUsers: cfg.commands.mod.warn.allowedUsers
    },

    async execute(api) {
        const targetUser = api.getTypedArg('user', 'user-mention-or-reference-msg-author')?.value as dsc.GuildMember | undefined;
        let points = api.getTypedArg('points', 'number')?.value as number ?? 1;
        let reason = api.getTypedArg('reason', 'trailing-string')?.value as string ?? '';
        let duration: number | null = null;
        let expiresAt: number | null = null;

        if (!targetUser) {
            return api.log.replyError(api.msg, cfg.customization.modTexts.noTargetSpecifiedHeader, cfg.customization.modTexts.noTargetSpecifiedText);
        }

        if (reason) {
            const split = reason.split(/\s+/);
            const possibleTime = split[0];
            const parsed = parseTimestamp(possibleTime);

            if (parsed != null) {
                duration = parsed;
                expiresAt = Math.floor(Date.now() / 1000) + duration;
                reason = split.slice(1).join(' ').trim();
            }
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
                cfg.customization.modTexts.havingMentalProblemsByWarningYourselfText
            );
        }

        points = clamp(cfg.commands.mod.warn.minPoints, points, cfg.commands.mod.warn.maxPoints);

        if (targetUser.id === api.msg.author.plainUser.client.user?.id) {
            points = 2;
            reason = cfg.customization.modTexts.warningEclairBotReason;
        }

        if (targetUser.id === '1409902422108934226') {
            points = 2;
            reason = cfg.customization.modTexts.warningWatchdogReason;
        }

        const embed = new dsc.EmbedBuilder()
            .setTitle(`📢 ${cfg.customization.modTexts.shitwarnHeader.replace('<mention>', targetUser.user.username)}`)
            .setDescription(cfg.customization.modTexts.warnDescription.replace('<points>', `${points}`))
            .addFields(
                { name: 'Moderator', value: `<@${api.msg.author.id}>`, inline: true },
                { name: 'Użytkownik', value: `<@${targetUser.id}>`, inline: true },
                { name: 'Powód', value: reason, inline: true },
                { name: 'Punkty', value: points.toString(), inline: true }
            )
            .setColor(PredefinedColors.Orange);

        if (duration) {
            embed.addFields({ name: 'Wygasa', value: `<t:${expiresAt}:R>`, inline: false });
        }

        await api.reply({ embeds: [embed] });
    }
};
