import { Command } from '../../bot/command.js';
import { cfg } from '../../bot/cfg.js'
import { db, sqlite } from '../../bot/db.js';

import * as log from '../../util/log.js';
import * as cfgManager from '../../bot/cfgManager.js';
import * as automod from '../../bot/automod.js';

import * as dsc from 'discord.js';
import { PredefinedColors } from '../../util/color.js';

const cmdCfg = cfg.mod.commands.ban;

export const banCmd: Command = {
    name: 'ban',
    longDesc: 'Jak masz uprawnienia, no to banuj ludzi. Taka praca... A jak nie, to nawet nie próbuj tego tykać!',
    shortDesc: 'Banuje danego użytkownika z serwera',
    expectedArgs: [
        { name: 'user',   desc: 'Osoba, która jest nieznośna idzie do tego pola...' },
        { name: 'reason', desc:
            cmdCfg.reasonRequired ? 'Powiedz innym modom czemu banujesz ludzi.' : 'Powiedz innym modom czemu banujesz ludzi. Możesz pominąć, ale jak to zrobisz, to naślę na ciebie FBI.',
        }
    ],

    aliases: cmdCfg.aliases,
    allowedRoles: cmdCfg.allowedRoles,
    allowedUsers: cmdCfg.allowedUsers,

    async execute(msg, args) {
        let targetUser: dsc.GuildMember | null = null;
        let reason = '';

        if (msg.reference?.messageId) {
            const repliedMsg = await msg.channel.messages.fetch(msg.reference.messageId);
            if (repliedMsg) {
                targetUser = repliedMsg.member;
            }
            reason = args.join(' ').trim();
        } else if (args.length > 0) {
            const userMention = args[0].match(/^<@!?(\d+)>$/);
            let userId: string | null = null;
            let reasonArgs: string[];

            if (userMention) {
                userId = userMention[1];
                reasonArgs = args.slice(1);
            } else if (/^\d+$/.test(args[0])) {
                userId = args[0];
                reasonArgs = args.slice(1);
            } else {
                reasonArgs = [...args];
            }

            if (userId) {
                targetUser = await msg.guild.members.fetch(userId).catch(() => null);
            }

            reason = reasonArgs.join(' ').trim();
        }

        if (targetUser == null) {
            log.replyError(msg, 'Nie podano celu', 'Kolego, myślisz że ja sie sam domyśle komu ty chcesz dać bana? Użycie: odpowiedzi na wiadomość lub !ban <@user> <powód>');
            return;
        }

        if (targetUser.roles.cache.hasAny(...cfg.general.moderationProtectedRoles)) {
            log.replyError(msg, 'Chronimy go!', 'Użytkownik poprosił o ochronę i ją dostał!');
            return;
        }

        if (reason == "" || reason == undefined) {
            if (cmdCfg.reasonRequired) {
                log.replyError(msg, 'Nie podano powodu', 'Ale za co ten ban? Poproszę o doprecyzowanie!');
                return;
            } else {
                reason = 'Moderator nie poszczycił się zbytnią znajomością komendy i nie podał powodu... Ale może to i lepiej';
            }
        }

        try {
            await targetUser.ban();
        } catch {
            return log.replyError(msg, 'Brak permisji', 'Coś Ty Eklerka znowu pozmieniał? No chyba że banujesz admina...');
        }

        msg.reply({
            embeds: [
                new dsc.EmbedBuilder()
                    .setTitle(`📢 ${targetUser.user.username} został zbanowany!`)
                    .setDescription(
                        `Multikonto? Już po nim... Wkurzający chłop? Uciszony na zawsze... Ktokolwiek? Nie może wbić, chyba że zrobi alta...`,
                    )
                    .addFields(
                        {
                            name: 'Moderator',
                            value: `<@${msg.author.id}>`,
                            inline: true,
                        },
                        {
                            name: 'Użytkownik',
                            value: `<@${targetUser.id}>`,
                            inline: true,
                        },
                        {
                            name: 'Powód',
                            value: reason,
                            inline: false,
                        },
                    )
                    .setColor(PredefinedColors.Orange),
            ],
        });
    }
}