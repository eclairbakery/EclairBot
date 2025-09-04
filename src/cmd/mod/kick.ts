import { NextGenerationCommand, NextGenerationCommandAPI } from '../../bot/command.js';
import { cfg } from '../../bot/cfg.js';
import * as dsc from 'discord.js';
import * as log from '../../util/log.js';
import { PredefinedColors } from '../../util/color.js';
import kick from '../../bot/apis/kicks.js';

const cmdCfg = cfg.mod.commands.kick;

export const kickCmd: NextGenerationCommand = {
    name: 'kick',
    description: {
        main: 'Ta komenda istnieje po to by pozbyć się z serwera lekko wkurzających ludzi, tak żeby im nie dawać bana, a oni żeby myśleli że mają bana. A pospólstwo to ręce z daleka od moderacji!',
        short: 'Wywala danego użytkownika z serwera'
    },
    args: [
        { name: 'user', type: 'user-mention', optional: false, description: 'W tej chwili dawaj użytkownika do skopniakowania!' },
        { name: 'reason', type: 'string', optional: !cmdCfg.reasonRequired, description: 'Powód wywalenia użytkownika' }
    ],
    aliases: cmdCfg.aliases,
    permissions: {
        discordPerms: null,
        allowedRoles: cmdCfg.allowedRoles,
        allowedUsers: cmdCfg.allowedUsers
    },
    execute: async (api: NextGenerationCommandAPI) => {
        const targetUser = api.getTypedArg('user', 'user-mention').value as dsc.GuildMember;
        let reason = api.getTypedArg('reason', 'string').value as string || null;

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
            await kick(targetUser, { reason });

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

            return api.msg.reply({
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

        } catch (e) {
            console.error(e);
            return log.replyError(api.msg, 'Brak permisji', 'Coś Ty Eklerka znowu pozmieniał? No chyba że kickujesz admina...');
        }
    }
};