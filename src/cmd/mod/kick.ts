import * as dsc from 'discord.js';
import { output } from '@/bot/logging.js';

import { Command, CommandFlags } from '@/bot/command.js';
import { cfg } from '@/bot/cfg.js';
import { PredefinedColors } from '@/util/color.js';
import kick from '@/bot/apis/mod/kicks.js';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.js';

const cmdCfg = cfg.legacy.commands.mod.kick;

export const kickCmd: Command = {
    name: 'kick',
    aliases: cmdCfg.aliases,
    description: {
        main: 'Ta komenda istnieje po to by pozbyć się z serwera lekko wkurzających ludzi, tak żeby im nie dawać bana, a oni żeby myśleli że mają bana. A pospólstwo to ręce z daleka od moderacji!',
        short: 'Wywala danego użytkownika z serwera'
    },
    flags: CommandFlags.Important,

    expectedArgs: [
        {
            name: 'user',
            description: 'W tej chwili dawaj użytkownika do skopniakowania!',
            type: { base: 'user-mention', includeRefMessageAuthor: true },
            optional: false,
        },
        {
            name: 'reason',
            description: 'Powód wywalenia użytkownika',
            type: { base: 'string', trailing: true },
            optional: !cmdCfg.reasonRequired,
        }
    ],
    permissions: {
        allowedRoles: cmdCfg.allowedRoles,
        allowedUsers: cmdCfg.allowedUsers,
    },

    async execute(api) {
        const targetUser = api.getTypedArg('user', 'user-mention').value as dsc.GuildMember;
        let reason = api.getTypedArg('reason', 'string').value as string || null;

        if (!targetUser) {
            return api.log.replyError(api, 'Nie podano celu', 'Kolego, myślisz że ja sie sam domyślę komu ty chcesz dać kopniaka? Użycie: odpowiedzi na wiadomość lub !kick <@user> <powód>');
        }

        if (targetUser.roles.cache.hasAny(...cfg.legacy.features.moderation.protectedRoles)) {
            return api.log.replyError(api, cfg.legacy.customization.modTexts.userIsProtectedHeader, cfg.legacy.customization.modTexts.userIsProtectedDesc);
        }

        if (!reason && cmdCfg.reasonRequired) {
            return api.log.replyError(api, cfg.legacy.customization.modTexts.reasonRequiredNotSpecifiedHeader, cfg.legacy.customization.modTexts.reasonRequiredNotSpecifiedText);
        } else if (!reason) {
            reason = cfg.legacy.customization.modTexts.defaultReason;
        }

        try {
            try {
                await targetUser.send({
                    embeds: [
                        new ReplyEmbed()
                            .setTitle('📢 Zostałeś wywalony z serwera Piekarnia eklerki!')
                            .setDescription(`To straszne wiem. Powód kicka brzmi: ${reason}`)
                            .setColor(PredefinedColors.Orange)
                    ]
                });
            } catch {}

            await kick(targetUser, { reason, mod: api.invoker.id });

            await api.reply({
                embeds: [
                    new ReplyEmbed()
                        .setTitle(`📢 ${targetUser.user.username} został wywalony!`)
                        .setDescription(`Ukróciłem jego zagrania! Miejmy nadzieję, że nie wbije znowu...`)
                        .addFields(
                            { name: 'Moderator', value: `<@${api.invoker.id}>`, inline: true },
                            { name: 'Użytkownik', value: `<@${targetUser.id}>`, inline: true },
                            { name: 'Powód', value: reason, inline: false }
                        )
                        .setColor(PredefinedColors.Orange)
                ]
            });
        } catch (err) {
            output.err(err);
            return api.log.replyError(api, 'Brak permisji', 'Coś Ty Eklerka znowu pozmieniał? No chyba że kickujesz admina...');
        }
    }
};
