import * as dsc from 'discord.js';
import * as log from '@/util/log.js';

import { Command, CommandAPI } from '@/bot/command.js';
import { cfg } from '@/bot/cfg.js';
import { PredefinedColors } from '@/util/color.js';
import { Hour, Timestamp } from '@/util/parseTimestamp.js';

import mute from '@/bot/apis/mod/muting.js';

const cmdCfg = cfg.mod.commands.mute;

export const muteCmd: Command = {
    name: 'mute',
    description: {
        main: 'Zamykam Ci buzię na czacie, żebyś mógł w ciszy przemyśleć swoje wybory życiowe. Jak chcesz pogadać, to poczekaj, aż Cię ktoś od muteuje.',
        short: 'Zamyka morde podanemu użytkownikowi'
    },
    expectedArgs: [
        {
            name: 'user',
            description: 'No ten, tu podaj użytkownika którego chcesz zmuteowac',
            type: 'user-mention-or-reference-msg-author',
            optional: false,
        },
        {
            name: 'duration',
            description: 'Długość mute, domyślnie 24h',
            type: 'timestamp',
            optional: true,
        },
        {
            name: 'reason',
            description: 'Powód wyciszenia użytkownika',
            type: 'trailing-string',
            optional: !cmdCfg.reasonRequired,
        },
    ],
    aliases: cmdCfg.aliases,
    permissions: {
        discordPerms: null,
        allowedRoles: cmdCfg.allowedRoles,
        allowedUsers: cmdCfg.allowedUsers,
    },
    execute: async (api: CommandAPI) => {
        const targetUser = api.getTypedArg('user', 'user-mention-or-reference-msg-author')?.value as dsc.GuildMember;
        let reason = api.getTypedArg('reason', 'trailing-string')?.value as string;
        const duration = api.getTypedArg('duration', 'timestamp')?.value as Timestamp | null ?? 24 * Hour;
        let expiresAt = duration != null ? Math.floor(Date.now() / 1000) + duration : null;

        // TODO: wtf? targetUser type is just dsc.GuildMember, not nullable...
        if (!targetUser) {
            return log.replyError(api.msg, 'Nie podano celu', 'Kolego, myślisz że ja sie sam domyślę komu ty chcesz dać tego timeouta? Użycie: odpowiedzi na wiadomość lub !mute <@user> <powód>');
        }

        if (!reason && cmdCfg.reasonRequired) {
            return log.replyError(api.msg, 'Nie podano powodu', 'Ale za co te wyciszenie? Poproszę o doprecyzowanie!');
        } else if (!reason) {
            reason = 'Moderator nie poszczycił się zbytnią znajomością komendy i nie podał powodu... Ale może to i lepiej';
        }

        if (targetUser.roles.cache.hasAny(...cfg.general.moderationProtectedRoles)) {
            return log.replyError(api.msg, 'Chronimy go!', 'Użytkownik poprosił o ochronę i ją dostał!');
        }

        try {
            await mute(targetUser, { reason, duration });

            const role = api.msg.guild?.roles.cache.find(r => r.name.toLowerCase().includes("zamknij ryj"));
            if (role != undefined) await targetUser.roles.add(role, reason);

            const logChannel = await api.msg.channel.client.channels.fetch(cfg.logs.channel);
            if (logChannel != null && logChannel.isSendable()) {
                logChannel.send({
                    embeds: [
                        new dsc.EmbedBuilder()
                            .setAuthor({ name: 'EclairBOT' })
                            .setColor(PredefinedColors.Purple)
                            .setTitle('Nałożono kłódkę na buzię')
                            .setDescription(`Użytkownik <@${targetUser.id}> został wyciszony na 24 godziny przez <@${api.msg.author.id}>.`)
                            .addFields([{ name: 'Powód', value: reason }])
                    ]
                });
            }

            return api.msg.reply({
                embeds: [
                    new dsc.EmbedBuilder()
                        .setTitle(`📢 Na ${targetUser.user.username} przymusowo nałożono kłódkę na buzię!`)
                        .setDescription(`Ciekawe czy wyjdzie z serwera... A, racja! Mogłem tego nie mówić.`)
                        .addFields(
                            { name: 'Moderator', value: `<@${api.msg.author.id}>`, inline: true },
                            { name: 'Użytkownik', value: `<@${targetUser.id}>`, inline: true },

                            { name: 'Powód', value: reason, inline: false },
                            { name: 'Czas', value:`<t:${expiresAt}:R>`, inline: true },
                        )
                        .setColor(PredefinedColors.Orange)
                ]
            });
        } catch (err) {
            console.log(err);
            return log.replyError(api.msg, 'Brak permisji', 'Coś Ty Eklerka znowu pozmieniał? No chyba że mutujesz admina...');
        }
    }
};