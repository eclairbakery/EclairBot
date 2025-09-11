import { Command } from '@/bot/command.js';
import { PredefinedColors } from '@/util/color.js';
import { cfg } from '@/bot/cfg.js';

import * as log from '@/util/log.js';
import * as dsc from 'discord.js';
import warn from '@/bot/apis/mod/warns.js';
import parseTimestamp, { Timestamp } from '@/util/parseTimestamp.js';
import clamp from '@/util/clamp.js';

export const warnCmd: Command = {
    name: 'warn',
    description: {
        main: 'Daj komuś warna, by go onieśmielić, uciszyć, zamknąć mu morde i nadużyć władzy. Żart, ale nie nadużywaj bo to się źle skończy... Nie wiesz z czym zadzierasz przybyszu!',
        short: 'Warnuje podaną osobę'
    },
    expectedArgs: [
        {
            name: 'user',
            description: 'No ten, tu podaj użytkownika którego chcesz zwarnować',
            type: 'user-mention-or-reference-msg-author',
            optional: false,
        },
        {
            name: 'points',
            description: `Tu ile warn-pointsów chcesz dać, domyślnie 1 i raczej tego nie zmieniaj. No i ten, maksymalnie możesz dać ${cfg.mod.commands.warn.maxPoints}`,
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
            description: cfg.mod.commands.warn.reasonRequired
                ? 'Po prostu powód warna'
                : 'Po prostu powód warna. Możesz go pominąć ale nie polecam',
            type: 'trailing-string',
            optional: !cfg.mod.commands.warn.reasonRequired,
        }
    ],

    aliases: cfg.mod.commands.warn.aliases,
    permissions: {
        discordPerms: null,
        allowedRoles: cfg.mod.commands.warn.allowedRoles,
        allowedUsers: cfg.mod.commands.warn.allowedUsers
    },

    async execute(api) {
        const targetUser = api.getTypedArg('user', 'user-mention-or-reference-msg-author')?.value as dsc.GuildMember | undefined;
        let points = api.getTypedArg('points', 'number')?.value as number ?? 1;
        let reason = api.getTypedArg('reason', 'trailing-string')?.value as string ?? '';
        const duration = api.getTypedArg('duration', 'timestamp')?.value as Timestamp | null;
        let expiresAt = duration != null ? Math.floor(Date.now() / 1000) + duration : null;

        console.log('Warn command args:', { targetUser, points, reason });

        if (!targetUser) {
            return log.replyError(
                api.msg,
                'Nie podano celu',
                'Kolego, myślisz że ja się sam domyślę komu chcesz dać warna? Użycie: reply na wiadomość lub !warn <@user> (punkty:1) <powód>'
            );
        }

        if (targetUser.roles.cache.hasAny(...cfg.general.moderationProtectedRoles)) {
            return log.replyError(api.msg, 'Chronimy go!', 'Użytkownik poprosił o ochronę i ją dostał!');
        }

        if (!reason) {
            if (cfg.mod.commands.warn.reasonRequired) {
                return log.replyError(api.msg, 'Nie podano powodu', 'Ale za co ten warn? proszę o doprecyzowanie!');
            } else {
                reason =
                    'Moderator nie poszczycił się zbytnią znajomością komendy i nie podał powodu... Ale może to i lepiej';
            }
        }

        if (targetUser.id === api.msg.author.id) {
            return log.replyError(
                api.msg,
                'Bro co ty odpierdalasz',
                'Co ty chcesz sobie dać warna :sob:? Co jest z tobą nie tak? Potrzebujesz pomocy?',
            );
        }

        points = clamp(cfg.mod.commands.warn.minPoints, points, cfg.mod.commands.warn.maxPoints);

        if (targetUser.id === api.msg.author.plainUser.client.user?.id) {
            points = 2;
            reason = 'nie warnuje się istoty wyższej panie';
        }

        if (targetUser.id === '1409902422108934226') {
            points = 2;
            reason = 'co prawda watchdog istotą wyższą nie jest ale się lubimy więc daje ci warna. nice try';
        }

        try {
            await warn(targetUser, {
                reason,
                expiresAt: expiresAt ?? null,
                points
            });
        } catch (err) {
            console.error(err);
            return log.replyError(api.msg, 'Błąd bazy danych', 'Nie udało się zapisać warna');
        }

        const embed = new dsc.EmbedBuilder()
            .setTitle(`📢 Masz warna, ${targetUser.user.username}!`)
            .setDescription(`Właśnie dostałeś darmoweeego warna (punktów: ${points})!`)
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

        await api.msg.reply({ embeds: [embed] });
    }
};