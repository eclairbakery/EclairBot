import { Command, CommandFlags, CommandPermissions } from '@/bot/command.js';
import { cfg } from '@/bot/cfg.js';
import { PredefinedColors } from '@/util/color.js';
import { output } from '@/bot/logging.js';
import { sendLog } from '@/bot/apis/log/send-log.js';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.js';

const cmdCfg = cfg.legacy.commands.mod.mute;

export const unmuteCmd: Command = {
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
            description: cmdCfg.reasonRequired
                ? 'Po prostu powód otworzenia mordy chłopa.'
                : 'Po prostu powód otworzenia mordy chłopa. Możesz pominąć, ale bądź tak dobry i tego nie rób...',
            optional: !cmdCfg.reasonRequired
        },
    ],
    permissions: CommandPermissions.fromCommandConfig(cmdCfg),

    async execute(api) {
        const targetUser = api.getTypedArg('user', 'user-mention')!.value!;
        let reason = api.getTypedArg('reason', "string")?.value;

        if (!targetUser) {
            return api.log.replyError(api, cfg.legacy.customization.modTexts.noTargetSpecifiedHeader, cfg.legacy.customization.modTexts.noTargetSpecifiedText);
        }

        if (!reason) {
            if (cmdCfg.reasonRequired) {
                return api.log.replyError(api, cfg.legacy.customization.modTexts.reasonRequiredNotSpecifiedHeader, cfg.legacy.customization.modTexts.reasonRequiredNotSpecifiedText);
            }
            reason = cfg.legacy.customization.modTexts.defaultReason;
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
                color: PredefinedColors.Pink
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
