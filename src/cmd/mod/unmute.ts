import { Command } from '@/bot/command.ts';
import { CommandFlags } from '@/bot/apis/commands/misc.ts';
import { CommandPermissions } from '@/bot/apis/commands/permissions.ts';
import { cfg } from '@/bot/cfg.ts';
import { PredefinedColors } from '@/util/color.ts';
import { sendLog } from '@/bot/apis/log/send-log.ts';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.ts';

const cmdCfg = cfg.commands.configuration.mute;

const unmuteCmd: Command = {
    name: 'unmute',
    aliases: [],
    description: {
        main: 'Oddaję Ci prawo głosu. Nie marnuj go na pisanie "xd" i emoji bakłażana.',
        short: 'Po prostu unmute',
    },
    flags: CommandFlags.Important,

    expectedArgs: [
        { name: 'user', type: { base: 'user-mention', includeRefMessageAuthor: true }, description: 'Komu unmute chcesz dać?', optional: false },
        {
            name: 'reason',
            type: { base: 'string', trailing: true },
            description: cmdCfg.reasonRequired ? 'Po prostu powód otworzenia mordy chłopa.' : 'Po prostu powód otworzenia mordy chłopa. Możesz pominąć, ale bądź tak dobry i tego nie rób...',
            optional: !cmdCfg.reasonRequired,
        },
    ],
    permissions: CommandPermissions.fromCommandConfig(cmdCfg),

    async execute(api) {
        const targetUser = api.getTypedArg('user', 'user-mention')!.value!;
        let reason = api.getTypedArg('reason', 'string')?.value;

        if (!targetUser) {
            return api.log.replyError(api, 'Nie podano celu', 'Kolego co ty myślisz że ja się sam domyślę, komu ty to chcesz zrobić? Zgadłeś - nie domyślę się. Więc bądź tak miły i podaj użytkownika, dla którego odpalasz tą komendę.');
        }

        if (!reason) {
            if (cmdCfg.reasonRequired) {
                return api.log.replyError(api, 'Musisz podać powód!', "Bratku... dlaczego ty chcesz to zrobić? Możesz mi chociaż powiedzieć, a nie wysuwać pochopne wnioski i banować/warnować/mute'ować ludzi bez powodu?");
            }
            reason = 'Moderator nie poszczycił się znajomością komendy i nie podał powodu... Ale moze to i lepiej...';
        }

        if (!targetUser.communicationDisabledUntilTimestamp || targetUser.communicationDisabledUntilTimestamp < Date.now()) {
            return api.log.replyWarn(api, 'Co ty robisz?', 'Ten użytkownik nie ma przerwy. Jak ty zamierzałeś odmutować osobę, która w ogóle nie była wyciszona? Weź może najpierw sprawdź czy osoba ma tę ikonkę albo coś.');
        }

        await targetUser.timeout(null, reason).catch(() => null);

        const muteRole = api.guild?.roles.cache.find((r) => r.name.toLowerCase().includes('zamknij ryj'));
        if (muteRole) {
            await targetUser.roles.remove(muteRole, reason).catch(() => null);
        }

        sendLog({
            title: 'Odciszono użytkownika',
            description: `Użytkownik <@${targetUser.id}> został odciszony przez <@${api.invoker.id}>.`,
            fields: [{ name: 'Powód', value: reason }],
            color: PredefinedColors.Pink,
        });

        return api.reply({
            embeds: [
                new ReplyEmbed()
                    .setTitle(`📢 ${targetUser.user.username} został odmutowany!`)
                    .setDescription('Prawo łaski zostało wyegzekwowane. Teraz ten super użytkownik może swobodnie wypowiadać się na dowolne tematy. No tylko by chatu nie spamił może...')
                    .setColor(PredefinedColors.Purple),
            ],
        });
    },
};

export default unmuteCmd;
