import * as dsc from 'discord.js';
import * as log from '@/util/log.js';
import * as debug from '@/util/debug.js';

import { Command, CommandAPI, CommandFlags } from '@/bot/command.js';
import { cfg } from '@/bot/cfg.js';
import { PredefinedColors } from '@/util/color.js';
import kick from '@/bot/apis/mod/kicks.js';

const cmdCfg = cfg.mod.commands.kick;

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
            type: 'user-mention-or-reference-msg-author',
            optional: false,
        },
        {
            name: 'reason',
            description: 'Powód wywalenia użytkownika',
            type: 'trailing-string',
            optional: !cmdCfg.reasonRequired,
        }
    ],
    permissions: {
        discordPerms: null,
        allowedRoles: cmdCfg.allowedRoles,
        allowedUsers: cmdCfg.allowedUsers
    },

    async execute(api) {
        const targetUser = api.getTypedArg('user', 'user-mention-or-reference-msg-author').value as dsc.GuildMember;
        let reason = api.getTypedArg('reason', 'trailing-string').value as string || null;

        if (!targetUser) {
            return log.replyError(api.msg, 'Nie podano celu', 'Kolego, myślisz że ja sie sam domyślę komu ty chcesz dać kopniaka? Użycie: odpowiedzi na wiadomość lub !kick <@user> <powód>');
        }

        if (targetUser.roles.cache.hasAny(...cfg.general.moderationProtectedRoles)) {
            return log.replyError(api.msg, 'Chronimy go!', 'Użytkownik poprosił o ochronę i ją dostał!');
        }

        if (!reason && cmdCfg.reasonRequired) {
            return log.replyError(api.msg, 'Nie podano powodu', 'Ale za co ten kick? Poproszę o doprecyzowanie!');
        } else if (!reason) {
            reason = 'Moderator nie poszczycił się zbytnią znajomością komendy i nie podał powodu... Ale może to i lepiej';
        }

        try {
            try {
                await targetUser.send({
                    embeds: [
                        new dsc.EmbedBuilder()
                            .setTitle('📢 Zostałeś wywalony z serwera Piekarnia eklerki!')
                            .setDescription(`To straszne wiem. Powód kicka brzmi: ${reason}`)
                            .setColor(PredefinedColors.Orange)
                    ]
                });
            } catch {}

            await kick(targetUser, { reason });

            await api.msg.reply({
                embeds: [
                    new dsc.EmbedBuilder()
                        .setTitle(`📢 ${targetUser.user.username} został wywalony!`)
                        .setDescription(`Ukróciłem jego zagrania! Miejmy nadzieję, że nie wbije znowu...`)
                        .addFields(
                            { name: 'Moderator', value: `<@${api.msg.author.id}>`, inline: true },
                            { name: 'Użytkownik', value: `<@${targetUser.id}>`, inline: true },
                            { name: 'Powód', value: reason, inline: false }
                        )
                        .setColor(PredefinedColors.Orange)
                ]
            });

            const logChannel = await api.msg.channel.client.channels.fetch(cfg.logs.channel);
            if (logChannel?.isSendable()) {
                logChannel.send({
                    embeds: [
                        new dsc.EmbedBuilder()
                            .setAuthor({ name: 'EclairBOT' })
                            .setColor(PredefinedColors.DarkGrey)
                            .setTitle('Wywalono członka')
                            .setDescription(`Użytkownik <@${targetUser.id}> (${targetUser.user.username}) został wyrzucony z serwera przez <@${api.msg.author.id}>!`)
                            .addFields([{ name: 'Powód', value: reason }])
                    ]
                });
            }
        } catch (err) {
            debug.err(err);
            return log.replyError(api.msg, 'Brak permisji', 'Coś Ty Eklerka znowu pozmieniał? No chyba że kickujesz admina...');
        }
    }
};
