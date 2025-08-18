import { Command } from '../../bot/command.js';
import { cfg } from '../../bot/cfg.js'
import { db, sqlite } from '../../bot/db.js';

import * as log from '../../util/log.js';
import * as cfgManager from '../../bot/cfgManager.js';
import * as automod from '../../bot/automod.js';

import * as dsc from 'discord.js';
import { PredefinedColors } from '../../util/color.js';

const cmdCfg = cfg.mod.commands.mute;

export const unmuteCmd: Command = {
    name: 'unmute',
    longDesc: 'Oddaję Ci prawo głosu. Nie marnuj go na pisanie "xd" i emoji bakłażana.',
    shortDesc: 'Poprostu unmute',
    expectedArgs: [
        { name: 'user',   desc: 'Komu unmute chcesz dać?' },
        { name: 'reason', desc:
            cmdCfg.reasonRequired ? 'Po prostu powód otworzenia mordy chłopa.' : 'Po prostu powód otworzenia mordy chłopa. Możesz pominąć, ale bądź tak dobry i tego nie rób...',
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
            log.replyError(msg, 'Nie podano celu', 'Kolego, myślisz że ja sie sam domyśle komu ty chcesz dać tego untimeouta? Użycie: odpowiedzi na wiadomość lub !mute <@user> <powód>');
            return;
        }

        if (reason == "" || reason == undefined) {
            if (cmdCfg.reasonRequired) {
                log.replyError(msg, 'Nie podano powodu', 'Ale za co te odwyciszenie? Poproszę o doprecyzowanie!');
                return;
            } else {
                reason = 'Moderator nie poszczycił się zbytnią znajomością komendy i nie podał powodu... Ale może to i lepiej';
            }
        }

        try {
            await targetUser.timeout(null, reason);
            const role = msg.guild.roles.cache.find(r => r.name.toLowerCase().includes("zamknij ryj"));
            if (!role) throw new Error('lmfao');
            await targetUser.roles.remove(role, reason);
        } catch (e) {
            console.log(e);
            return log.replyError(msg, 'Brak permisji', 'Coś Ty Eklerka znowu pozmieniał?');
        }

        msg.reply({
            embeds: [
                new dsc.EmbedBuilder()
                    .setTitle(`📢 ${targetUser.user.username} został odmutowany!`)
                    .setDescription(
                        `Tylko nie spam chatu i przestrzegaj regulaminu... I guess...`,
                    )
                    .setColor(PredefinedColors.Purple),
            ],
        });
    }
}