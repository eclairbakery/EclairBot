import { Command } from '@/bot/command.ts';
import { CommandFlags } from '@/bot/apis/commands/misc.ts';
import { CommandPermissions } from '@/bot/apis/commands/permissions.ts';
import { cfg } from '@/bot/cfg.ts';
import { PredefinedColors } from '@/util/color.ts';
import { output } from '@/bot/logging.ts';
import { sendLog } from '@/bot/apis/log/send-log.ts';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.ts';

const cmdCfg = cfg.commands.configuration.mute;

const unmuteCmd: Command = {
    name: 'unmute',
    aliases: cmdCfg.aliases,
    description: {
        main: 'Oddaję Ci prawo głosu. Nie marnuj go na pisanie "xd" i emoji bakłażana.',
        short: 'Po prostu unmute',
    },
    flags: CommandFlags.Important,

    expectedArgs: [
        { name: 'user', type: { base: 'user-mention', includeRefMessageAuthor: true }, description: 'Komu unmute chcesz dać?', optional: false },
        {
            name: 'reason',
            type: { base: 'string' },
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

        try {
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
                        .setDescription('Tylko nie spam chatu i przestrzegaj regulaminu... I guess...')
                        .setColor(PredefinedColors.Purple),
                ],
            });
        } catch (err) {
            output.err(err);
            return api.log.replyError(api, 'Błąd', 'Nie udało się odciszyć użytkownika. Sprawdź permisje.');
        }
    },
};

export default unmuteCmd;
