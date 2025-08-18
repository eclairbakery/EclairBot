import { Command } from '../../bot/command.js';
import { cfg } from '../../bot/cfg.js'
import { db, sqlite } from '../../bot/db.js';

import * as log from '../../util/log.js';
import * as cfgManager from '../../bot/cfgManager.js';
import * as automod from '../../bot/automod.js';

import * as dsc from 'discord.js';
import { PredefinedColors } from '../../util/color.js';

const cmdCfg = cfg.mod.commands.kick;

export const kickCmd: Command = {
    name: 'kick',
    longDesc: 'Ta komenda istnieje po to by pozbyć się z serwera lekko wkurzających ludzi, tak żeby im nie dawać bana, a oni żeby myśleli że mają bana. A pospólstwo to ręce z daleka od moderacji!',
    shortDesc: 'Wywala danego użytkownika z serwera',
    expectedArgs: [
        { name: 'user',   desc: 'W tej chwili dawaj użytkownika do skopniakowania!' },
        { name: 'reason', desc:
            cmdCfg.reasonRequired ? 'Po prostu powód wywalenia chłopa z serwera.' : 'Po prostu powód wywalenia chłopa z serwera. Możesz pominąć, ale bądź tak dobry i tego nie rób...',
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
                targetUser = await msg.guild.members.fetch(userId);
            }

            reason = reasonArgs.join(' ').trim();
        }

        if (targetUser == null) {
            log.replyError(msg, 'Nie podano celu', 'Kolego, myślisz że ja sie sam domyśle komu ty chcesz dać kopniaka? Użycie: odpowiedzi na wiadomość lub !kick <@user> <powód>');
            return;
        }

        if (targetUser.roles.cache.hasAny(...cfg.general.moderationProtectedRoles)) {
            log.replyError(msg, 'Chronimy go!', 'Użytkownik poprosił o ochronę i ją dostał!');
            return;
        }

        if (reason == "" || reason == undefined) {
            if (cmdCfg.reasonRequired) {
                log.replyError(msg, 'Nie podano powodu', 'Ale za co ten kick? Poproszę o doprecyzowanie!');
                return;
            } else {
                reason = 'Moderator nie poszczycił się zbytnią znajomością komendy i nie podał powodu... Ale może to i lepiej';
            }
        }

        try {
            await targetUser.kick();
        } catch (e) {
            console.log(e);
            return log.replyError(msg, 'Brak permisji', 'Coś Ty Eklerka znowu pozmieniał? No chyba że kickujesz admina...');
        }

        msg.reply({
            embeds: [
                new dsc.EmbedBuilder()
                    .setTitle(`📢 ${targetUser.user.username} został wywalony!`)
                    .setDescription(
                        `Ukróciłem jego zagrania! Miejmy nadzieję, że nie wbije znowu...`,
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