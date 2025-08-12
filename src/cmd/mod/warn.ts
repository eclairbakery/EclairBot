import clamp from '../../util/clamp.js';

import { Command } from '../../bot/command.js';
import { PredefinedColors } from '../../util/color.js';
import { cfg } from '../../bot/cfg.js'
import { db, sqlite } from '../../bot/db.js';

import * as log from '../../util/log.js';
import * as cfgManager from '../../bot/cfgManager.js';
import * as automod from '../../bot/automod.js';

import * as dsc from 'discord.js';

const cmdCfg = cfg.mod.commands.warn;

export const warnCmd: Command = {
    name: 'warn',
    desc: 'Daj komuś warna, by go onieśmielić, uciszyć, zamknąć mu morde i nadużyć władzy. Żart, ale nie nadużywaj bo to się źle skończy... Nie wiesz z czym zadzierasz przybyszu!',
    category: 'moderacyjne rzeczy',
    expectedArgs: [
        { name: 'user',   desc: 'No ten, tu podaj użytkownika którego chcesz zwarnować' },
        { name: 'points', desc:
            `Tu ile warn-pointsów chcesz dać, domyślnie 1 i raczej tego nie zmieniaj. No i ten, maksymalnie możesz dać ${cmdCfg.maxPoints}`
        },
        { name: 'reason', desc:
            cmdCfg.reasonRequired ? 'Poprostu powód warna' : 'Poprostu powód warna. Możesz go pominąć ale nie polecam',
        }
    ],

    aliases: cmdCfg.aliases,
    allowedRoles: cmdCfg.allowedRoles,
    allowedUsers: cmdCfg.allowedUsers,

    async execute(msg, args) {
        let targetUser: dsc.GuildMember | null = null;
        let points = 1;
        let reason = '';
        let reasonArgs = [...args];

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
                targetUser = await msg.guild.members.fetch(userId).catch(() => null);
                if (targetUser) {
                    reasonArgs = args.slice(1);
                }
            }
        }

        if (targetUser == null && msg.reference?.messageId) {
            const repliedMsg = await msg.channel.messages.fetch(msg.reference.messageId).catch(() => null);
            if (repliedMsg) {
                targetUser = repliedMsg.author;
            }
        }

        if (targetUser == null) {
            log.replyError(msg, 'Nie podano celu', 'Kolego, myślisz że ja sie sam domyśle komu ty chcesz dać warna? Uzycie: odpowiedzi na wiadomość lub !warn <@user> (punkty:1) <powód>');
            return;
        }

        if (targetUser.roles.cache.hasAny(...cfg.general.moderationProtectedRoles)) {
            log.replyError(msg, 'Chronimy go!', 'Użytkownik poprosił o ochronę i ją dostał!');
            return;
        }

        if (reasonArgs.length > 0 && /^\d+$/.test(reasonArgs[0])) {
            points = parseInt(reasonArgs[0], 10);
            reason = reasonArgs.slice(1).join(' ').trim();
        } else {
            reason = reasonArgs.join(' ').trim();
        }

        if (reason == "" || reason == undefined) {
            if (cmdCfg.reasonRequired) {
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

        points = clamp(cmdCfg.minPoints, points, cmdCfg.maxPoints);

        db.run('INSERT INTO warns VALUES (NULL, ?, ?, ?)', [targetUser.id, reason, points]);
        msg.reply({
            embeds: [
                new dsc.EmbedBuilder()
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
                    .setColor(PredefinedColors.Orange),
            ],
        });
    }
}