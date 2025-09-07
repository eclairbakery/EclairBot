import clamp from '@/util/clamp.js';
import parseTimestamp from '@/util/parseTimestamp.js';

import { Command } from '@/bot/command.js';
import { PredefinedColors } from '@/util/color.js';
import { cfg } from '@/bot/cfg.js';

import * as log from '@/util/log.js';
import * as dsc from 'discord.js';

export const shitwarnCmd: Command = {
    name: 'warn',
    description: {
        main: 'Lubisz warnować? Świetnie! Ta komenda daje fake-warny!',
        short: 'Ta komenda daje fake-warny!'
    },
    expectedArgs: [
        {
            name: 'user',
            type: 'user-mention',
            description: 'No ten, tu podaj użytkownika którego chcesz zwarnować',
            optional: false
        },
        {
            name: 'points',
            type: 'number',
            description: `Tu ile warn-pointsów chcesz dać, domyślnie 1 i raczej tego nie zmieniaj. No i ten, maksymalnie możesz dać ${cfg.mod.commands.warn.maxPoints}`,
            optional: true
        },
        {
            name: 'reason',
            type: 'string',
            description: cfg.mod.commands.warn.reasonRequired
                ? 'Po prostu powód warna'
                : 'Po prostu powód warna. Możesz go pominąć ale nie polecam',
            optional: !cfg.mod.commands.warn.reasonRequired
        }
    ],

    aliases: cfg.mod.commands.warn.aliases,
    permissions: {
        discordPerms: null,
        allowedRoles: cfg.mod.commands.warn.allowedRoles,
        allowedUsers: cfg.mod.commands.warn.allowedUsers
    },

    async execute(api) {
        const targetUser = api.getTypedArg('user', 'user-mention')?.value as dsc.GuildMember | undefined;
        let points = api.getTypedArg('points', 'number')?.value as number ?? 1;
        let reason = api.getTypedArg('reason', 'string')?.value as string ?? '';
        let duration: number | null = null;
        let expiresAt: number | null = null;

        if (!targetUser) {
            return log.replyError(
                api.msg,
                'Nie podano celu',
                'Kolego, myślisz że ja się sam domyślę komu chcesz dać warna? Użycie: reply na wiadomość lub !warn <@user> (punkty:1) <powód>'
            );
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
                'Co ty chcesz sobie dać warna :sob:? Co jest z tobą nie tak? Potrzebujesz pomocy?'
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

        const embed = new dsc.EmbedBuilder()
            .setTitle(`📢 Masz fake-warna/shitwarna, ${targetUser.user.username}!`)
            .setDescription(`Właśnie dostałeś darmoweeego warna (punktów: ${points})!`)
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

        await api.msg.reply({ embeds: [embed] });
    }
};