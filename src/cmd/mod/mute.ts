import { Command } from '../../bot/command.js';
import { cfg } from '../../bot/cfg.js'
import { db, sqlite } from '../../bot/db.js';

import * as log from '../../util/log.js';
import * as cfgManager from '../../bot/cfgManager.js';
import * as automod from '../../bot/automod.js';

import * as dsc from 'discord.js';
import { PredefinedColors } from '../../util/color.js';

const cmdCfg = cfg.mod.commands.mute;

export const muteCmd: Command = {
    name: 'mute',
    desc: 'Zamykam Ci buzię na czacie, żebyś mógł w ciszy przemyśleć swoje wybory życiowe. Jak chcesz pogadać, to poczekaj, aż Cię ktoś wypuści z izolatki.',
    category: 'moderacyjne rzeczy',
    expectedArgs: [
        { name: 'user',   desc: 'Komu mute chcesz dać?' },
        { name: 'reason', desc:
            cmdCfg.reasonRequired ? 'Po prostu powód zamknięcia mordy chłopa.' : 'Po prostu powód zamknięcia mordy chłopa. Możesz pominąć, ale bądź tak dobry i tego nie rób...',
        }
    ],

    aliases: cmdCfg.aliases,
    allowedRoles: cmdCfg.allowedRoles,
    allowedUsers: cmdCfg.allowedUsers,

    async execute(msg, args) {
        let targetUser: dsc.GuildMember | null = null;
        let reason = '';

        if (msg.reference?.messageId) {
            const repliedMsg = await msg.channel.messages.fetch(msg.reference.messageId).catch(() => null);
            if (repliedMsg) {
                targetUser = repliedMsg.author;
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
            log.replyError(msg, 'Nie podano celu', 'Kolego, myślisz że ja sie sam domyśle komu ty chcesz dać tego timeouta? Użycie: odpowiedzi na wiadomość lub !mute <@user> <powód>');
            return;
        }

        if (targetUser.roles.cache.hasAny(...cfg.general.moderationProtectedRoles)) {
            log.replyError(msg, 'Chronimy go!', 'Użytkownik poprosił o ochronę i ją dostał!');
            return;
        }

        if (reason == "" || reason == undefined) {
            if (cmdCfg.reasonRequired) {
                log.replyError(msg, 'Nie podano powodu', 'Ale za co te wyciszenie? Poproszę o doprecyzowanie!');
                return;
            } else {
                reason = 'Moderator nie poszczycił się zbytnią znajomością komendy i nie podał powodu... Ale może to i lepiej';
            }
        }

        try {
            await targetUser.timeout(24 * 60 * 60 * 1000, reason);
            const role = msg.guild.roles.cache.find(r => r.name.toLowerCase().includes("zamknij ryj"));
            if (!role) throw new Error('lmfao');
            await targetUser.roles.add(role, reason);
        } catch (e) {
            console.log(e);
            return log.replyError(msg, 'Brak permisji', 'Coś Ty Eklerka znowu pozmieniał? No chyba że mutujesz admina...');
        }

        msg.reply({
            embeds: [
                new dsc.EmbedBuilder()
                    .setTitle(`📢 Na ${targetUser.user.username} przymusowo nałożono kłódkę na buzię!`)
                    .setDescription(
                        `Ciekawe czy wyjdzie z serwera... A, racja! Mogłem tego nie mówić.`,
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
                        {
                            name: 'Czas',
                            value: '24 godziny',
                            inline: true,
                        }
                    )
                    .setColor(PredefinedColors.Orange),
            ],
        });
    }
}