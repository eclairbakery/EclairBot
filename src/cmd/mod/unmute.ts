import { Command, CommandFlags } from '@/bot/command.js';
import { cfg } from '@/bot/cfg.js';
import * as log from '@/util/log.js';
import * as dsc from 'discord.js';
import { PredefinedColors } from '@/util/color.js';
import { output } from '@/bot/logging.js';
import { sendLog } from '@/bot/apis/log/send-log.js';

const cmdCfg = cfg.commands.mod.mute;

export const unmuteCmd: Command = {
    name: 'unmute',
    aliases: cmdCfg.aliases,
    description: {
        main: 'Oddaję Ci prawo głosu. Nie marnuj go na pisanie "xd" i emoji bakłażana.',
        short: 'Po prostu unmute',
    },
    flags: CommandFlags.Important,

    expectedArgs: [
        { name: 'user', type: 'string', description: 'Komu unmute chcesz dać?', optional: false },
        {
            name: 'reason',
            type: 'string',
            description: cmdCfg.reasonRequired
                ? 'Po prostu powód otworzenia mordy chłopa.'
                : 'Po prostu powód otworzenia mordy chłopa. Możesz pominąć, ale bądź tak dobry i tego nie rób...',
            optional: !cmdCfg.reasonRequired
        },
    ],
    permissions: {
        discordPerms: null,
        allowedRoles: cmdCfg.allowedRoles,
        allowedUsers: cmdCfg.allowedUsers,
    },

    async execute(api) {
        let targetUser: dsc.GuildMember | null = null;
        let reason = '';

        const userArg = api.getArg('user')?.value;
        const reasonArg = api.args.find((a) => a.name === 'reason')?.value as string | undefined;

        if (api.referenceMessage) {
            targetUser = api.referenceMessage.member!.plainMember;
            reason = reasonArg ?? '';
        } else if (userArg) {
            const mention = (userArg as string).match(/^<@!?(\d+)>$/);
            const userId = mention ? mention[1] : /^\d+$/.test(userArg as string) ? (userArg as string) : null;

            if (userId) {
                targetUser = await api.msg.guild?.members.fetch(userId).catch(() => null) ?? null;
            }

            reason = reasonArg ?? '';
        }

        if (!targetUser) {
            return api.log.replyError(api.msg, cfg.customization.modTexts.noTargetSpecifiedHeader, cfg.customization.modTexts.noTargetSpecifiedText);
        }

        if (!reason) {
            if (cmdCfg.reasonRequired) {
                return api.log.replyError(api.msg, cfg.customization.modTexts.reasonRequiredNotSpecifiedHeader, cfg.customization.modTexts.reasonRequiredNotSpecifiedText);
            }
            reason = cfg.customization.modTexts.defaultReason;
        }

        try {
            await targetUser.timeout(null, reason).catch(() => null);

            const muteRole = api.msg.guild?.roles.cache.find((r) => r.name.toLowerCase().includes('zamknij ryj'));
            if (muteRole) {
                await targetUser.roles.remove(muteRole, reason).catch(() => null);
            }

            sendLog({
                title: 'Odciszono użytkownika',
                description: `Użytkownik <@${targetUser.id}> został odciszony przez <@${api.msg.author.id}>.`,
                fields: [{ name: 'Powód', value: reason }],
                color: PredefinedColors.Pink
            });
            
            return api.reply({
                embeds: [
                    new dsc.EmbedBuilder()
                        .setTitle(`📢 ${targetUser.user.username} został odmutowany!`)
                        .setDescription('Tylko nie spam chatu i przestrzegaj regulaminu... I guess...')
                        .setColor(PredefinedColors.Purple),
                ],
            });
        } catch (err) {
            output.err(err);
            return api.log.replyError(api.msg, 'Błąd', 'Nie udało się odciszyć użytkownika. Sprawdź permisje.');
        }
    },
};
