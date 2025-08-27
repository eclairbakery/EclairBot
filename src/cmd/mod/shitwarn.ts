import clamp from '../../util/clamp.js';
import parseTimestamp from '../../util/parseTimestamp.js';

import { Command } from '../../bot/command.js';
import { PredefinedColors } from '../../util/color.js';
import { cfg } from '../../bot/cfg.js'
import { db, sqlite } from '../../bot/db.js';

import * as log from '../../util/log.js';

import * as dsc from 'discord.js';
import { scheduleWarnDeletion } from '../../features/deleteExpiredWarns.js';

export const shitwarnCmd: Command = {
    name: 'shitwarn',
    longDesc: 'Lubisz warnować? Świetnie się składa! To wysyła embed ale nie warnuje. Ochrona przed warnami jest wyłączona.',
    shortDesc: 'Robi fake warna!',
    expectedArgs: [
        { name: 'user',   desc: 'No ten, tu podaj użytkownika którego chcesz zwarnować' },
        { name: 'points', desc:
            `Tu ile warn-pointsów chcesz dać, domyślnie 1 i raczej tego nie zmieniaj. No i ten, maksymalnie możesz dać ${cfg.mod.commands.warn.maxPoints}`
        },
        { name: 'reason', desc:
            cfg.mod.commands.warn.reasonRequired ? 'Poprostu powód warna' : 'Poprostu powód warna. Możesz go pominąć ale nie polecam',
        }
    ],

    aliases: cfg.mod.commands.warn.aliases,
    allowedRoles: cfg.mod.commands.warn.allowedRoles,
    allowedUsers: cfg.mod.commands.warn.allowedUsers,

    async execute(msg, args) {
        let targetUser: dsc.GuildMember | null = null;
        let points = 1;
        let reason = '';
        let reasonArgs = [...args];
        let duration: number | null = null;
        let expiresAt: number | null = null;

        if (args.length > 0) {
            const userMention = args[0].match(/^<@!?(\d+)>$/);
            const userIdMatch = /^\d+$/.test(args[0]);
            let userId: string | null = null;

            if (userMention) {
                userId = userMention[1];
            } else if (userIdMatch) {
                userId = args[0];
            }

            if (userId) {
                try {
                    targetUser = await msg.guild.members.fetch(userId);
                    if (targetUser) {
                        reasonArgs = args.slice(1);
                    }
                } catch {}
            }
        }

        if (targetUser == null && msg.reference?.messageId) {
            let repliedMsg: dsc.Message | null = null;
            try {
                repliedMsg = await msg.channel.messages.fetch(msg.reference.messageId);
            } catch {}
            if (repliedMsg) {
                targetUser = repliedMsg.member;
            }
        }

        if (targetUser == null) {
            log.replyError(msg, 'Nie podano celu', 'Kolego, myślisz że ja sie sam domyśle komu ty chcesz dać warna? Uzycie: odpowiedzi na wiadomość lub !warn <@user> (punkty:1) <powód>');
            return;
        }

        if (reasonArgs.length > 0) {
            const possibleTime = reasonArgs[0];
            duration = parseTimestamp(possibleTime);
            if (duration != null) {
                reason = reasonArgs.slice(1).join(' ').trim();
                expiresAt = Math.floor(Date.now() / 1000) + duration;
            } else if (/^\d+$/.test(reasonArgs[0])) {
                points = parseInt(reasonArgs[0], 10);
                reason = reasonArgs.slice(1).join(' ').trim();
            } else {
                reason = reasonArgs.join(' ').trim();
            }
        }

        if (reason == "" || reason == undefined) {
            if (cfg.mod.commands.warn.reasonRequired) {
                log.replyError(msg, 'Nie podano powodu', 'Ale za co ten warn? proszę o doprecyzowanie!');
                return;
            } else {
                reason = 'Moderator nie poszczycił się zbytnią znajomością komendy i nie podał powodu... Ale może to i lepiej';
            }
        }

        if (targetUser.id == msg.author.id) {
            log.replyError(msg, 'Bro co ty odpierdalasz', 'Co ty chcesz sobie dać warna :sob:? Co jest z tobą nie tak? Potrzebujesz pomocy?');
            return;
        }

        points = clamp(cfg.mod.commands.warn.minPoints, points, cfg.mod.commands.warn.maxPoints);

        const embed = new dsc.EmbedBuilder()
            .setTitle(`📢 Masz warna, ${targetUser.user.username}!`)
            .setDescription(
                `Właśnie dostałeś darmoweeego warna (punktów: ${points})!`,
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
                    name: '',
                    value: '',
                    inline: false,
                },
                {
                    name: 'Powód',
                    value: reason,
                    inline: true,
                },
                {
                    name: 'Punkty',
                    value: points.toString(),
                    inline: true,
                }
            )
            .setColor(PredefinedColors.Orange);

        if (duration) {
            embed.addFields({ name: 'Wygasa', value: `<t:${expiresAt}:R>`, inline: false });
        }

        msg.reply({
            embeds: [embed],
        });
    }
}