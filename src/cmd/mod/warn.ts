import { Command } from '@/bot/command.ts';
import { CommandFlags } from '@/bot/apis/commands/misc.ts';
import { CommandPermissions } from '@/bot/apis/commands/permissions.ts';
import { PredefinedColors } from '@/util/color.ts';
import { cfg } from '@/bot/cfg.ts';

import * as dsc from 'discord.js';

import warn from '@/bot/apis/mod/warns.ts';
import parseTimestamp, { Timestamp } from '@/util/parseTimestamp.ts';
import clamp from '@/util/math/clamp.ts';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.ts';

const warnCmd: Command = {
    name: 'warn',
    aliases: cfg.commands.configuration.warn.aliases,
    description: {
        main: 'Daj komuś warna, by go onieśmielić, uciszyć, zamknąć mu morde i nadużyć władzy. Żart, ale nie nadużywaj bo to się źle skończy... Nie wiesz z czym zadzierasz przybyszu!',
        short: 'Warnuje podaną osobę',
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
            description: `Tu ile warn-pointsów chcesz dać, domyślnie 1 i raczej tego nie zmieniaj. No i ten, maksymalnie możesz dać ${cfg.commands.configuration.warn.maxPoints}`,
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
            description: cfg.commands.configuration.warn.reasonRequired ? 'Po prostu powód warna' : 'Po prostu powód warna. Możesz go pominąć ale nie polecam',
            type: { base: 'string', trailing: true },
            optional: !cfg.commands.configuration.warn.reasonRequired,
        },
    ],

    permissions: CommandPermissions.fromCommandConfig(cfg.commands.configuration.warn),

    async execute(api) {
        let targetUser = api.getTypedArg('user', 'user-mention')?.value as dsc.GuildMember | undefined;
        let points = api.getTypedArg('points', 'float')?.value as number ?? 1;
        let reason = api.getTypedArg('reason', 'string')?.value as string ?? '';
        const duration = api.getTypedArg('duration', 'timestamp')?.value as Timestamp | null;
        const expiresAt = (duration != null ? Math.floor(Date.now() / 1000) + duration : null) ?? (Math.floor(Date.now() / 1000) + parseTimestamp('24h')!);

        if (!targetUser) {
            return api.log.replyError(
                api,
                'Nie podano celu',
                'Kolego co ty myślisz że ja się sam domyślę, komu ty to chcesz zrobić? Zgadłeś - nie domyślę się. Więc bądź tak miły i podaj użytkownika, dla którego odpalasz tą komendę.',
            );
        }

        if (!reason) {
            if (cfg.commands.configuration.warn.reasonRequired) {
                return api.log.replyError(api, 'Musisz podać powód!', "Bratku... dlaczego ty chcesz to zrobić? Możesz mi chociaż powiedzieć, a nie wysuwać pochopne wnioski i banować/warnować/mute'ować ludzi bez powodu?");
            } else {
                reason = 'Moderator nie poszczycił się znajomością komendy i nie podał powodu... Ale moze to i lepiej...';
            }
        }

        if ([api.executor.id, ...(await api.executor.fetchAlternativeAccounts())].includes(targetUser.id)) {
            return api.log.replyError(
                api,
                'Bro co ty odpierdalasz?',
                'Czemu ty chcesz sobie dać warna? Co jest z tobą nie tak... Zabrać cię do szpitala zdrowia psychicznego czy co ja mam zrobić...',
            );
        } 

        points = clamp(cfg.commands.configuration.warn.minPoints, points, cfg.commands.configuration.warn.maxPoints);

        if (targetUser.id === api.invoker.user.client.user?.id) {
            points = 2;
            reason = 'nie warnuje się istoty wyższej panie';
            targetUser = api.invoker.member!;
        }

        await warn(targetUser, {
            reason,
            expiresAt: expiresAt ?? null,
            points,
            mod: api.invoker.id,
        });

        const embed = new ReplyEmbed()
            .setTitle(`📢 ${targetUser.user.username} dostał warna od ${api.invoker.user.username}`)
            .setDescription('Warn w skrócie ma <points> punktów i skończy się <duration>.'.replace('<points>', `${points}`).replace('<duration>', `<t:${expiresAt}:R>`))
            .setColor(PredefinedColors.Orange);

        await api.reply({ embeds: [embed] });
    },
};

export default warnCmd;
