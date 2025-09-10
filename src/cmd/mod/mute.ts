import { Command, CommandAPI } from '@/bot/command.js';
import { cfg } from '@/bot/cfg.js';
import * as dsc from 'discord.js';
import * as log from '@/util/log.js';
import { PredefinedColors } from '@/util/color.js';
import mute from '@/bot/apis/muting.js';

const cmdCfg = cfg.mod.commands.mute;

export const muteCmd: Command = {
    name: 'mute',
    description: {
        main: 'Zamykam Ci buzię na czacie, żebyś mógł w ciszy przemyśleć swoje wybory życiowe. Jak chcesz pogadać, to poczekaj, aż Cię ktoś wypuści z izolatki.',
        short: 'Zamyka morde podanemu użytkownikowi'
    },
    expectedArgs: [
        { name: 'user', type: 'user-mention', optional: false, description: 'Komu mute chcesz dać?' },
        { name: 'reason', type: 'trailing-string', optional: !cmdCfg.reasonRequired, description: 'Powód wyciszenia użytkownika' }
    ],
    aliases: cmdCfg.aliases,
    permissions: {
        discordPerms: null,
        allowedRoles: cmdCfg.allowedRoles,
        allowedUsers: cmdCfg.allowedUsers
    },
    execute: async (api: CommandAPI) => {
        const targetUser = api.getTypedArg('user', 'user-mention').value as dsc.GuildMember;
        let reason = api.getTypedArg('reason', 'string').value as string || null;

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
            mute(targetUser, { reason, duration: 24 * 60 * 60 });

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
                            { name: 'Czas', value: '24 godziny', inline: true },
                        )
                        .setColor(PredefinedColors.Orange)
                ]
            });
        } catch (e) {
            console.error(e);
            return log.replyError(api.msg, 'Brak permisji', 'Coś Ty Eklerka znowu pozmieniał? No chyba że mutujesz admina...');
        }
    }
};