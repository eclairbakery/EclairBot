import { Command } from 'bot/command';
import { cfg } from 'bot/cfg'
import { db, sqlite } from 'bot/db';

import * as log from 'util/log';
import * as cfgManager from 'bot/cfgManager';
import * as automod from 'bot/automod';

import * as dsc from 'discord.js';

const cmdCfg = cfg.mod.commands.warn;

export const warnCmd: Command = {
    name: 'warn',
    desc: 'Daj komuś warna, by go onieśmielić, uciszyć, zamknąć mu morde i nadużyć władzy. Żart, ale nie nadużywaj bo to się źle skończy... Nie wiesz z czym zadzierasz przybyszu!',
    expectedArgs: [
        { name: 'user',   desc: 'No ten, tu podaj użytkownika którego chcesz zwarnować' },
        { name: 'reason', desc:
            cmdCfg.reasonRequired ? 'Poprostu powód warna' : 'Poprostu powód warna. Możesz go pominąć ale nie polecam',
        }
    ],

    aliases: cmdCfg.aliases,
    allowedRoles: cmdCfg.allowedRoles,
    allowedUsers: cmdCfg.allowedUsers,

    async execute(msg, args) {
        let targetUser: dsc.User | null = null;
        let points = 1;
        let reason = '';

        if (msg.reference?.messageId) {
            const repliedMsg = await msg.channel.messages.fetch(msg.reference.messageId).catch(() => null);
            if (repliedMsg) {
                targetUser = repliedMsg.author;
            }
            // in reply mode, args are (points) <reason>
            if (args.length > 0 && /^\d+$/.test(args[0])) {
                points = parseInt(args[0], 10);
                reason = args.slice(1).join(' ').trim();
            } else {
                reason = args.join(' ').trim();
            }
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
                // if the first argument is neither a mention nor an ID, we can't identify a user.
                // the `who == null` check below will catch this.
                reasonArgs = [...args];
            }

            if (userId) {
                targetUser = await msg.client.users.fetch(userId).catch(() => null);
            }

            // After getting user, the rest is (points) [reason...]
            if (reasonArgs.length > 0 && /^\d+$/.test(reasonArgs[0])) {
                points = parseInt(reasonArgs[0], 10);
                reason = reasonArgs.slice(1).join(' ').trim();
            } else {
                reason = reasonArgs.join(' ').trim();
            }
        }

        if (targetUser == null) {
            log.replyError(msg, 'Nie podano celu', 'Kolego, myślisz że ja sie sam domyśle komu ty chcesz dać warna? Uzycie: odpowiedzi na wiadomość lub !warn <@user> (punkty:1) <powód>');
            return;
        }

        if (reason == "" || reason == undefined) {
            if (cmdCfg.reasonRequired) {
                log.replyError(msg, 'Nie podano powodu', 'Ale za co ten warn? proszę o doprecyzowanie!');
                return;
            } else {
                reason = 'Moderator nie poszczycił się zbytnią znajomością komendy i nie podał powodu... Ale może to i lepiej';
            }
        }

        if (points < 1) points = 1;
        if (points > 100) points = 100;

        db.run('INSERT INTO warns VALUES (NULL, ?, ?, ?)', [targetUser.id, reason, points]);
        let x: dsc.APIEmbedField;
        msg.reply({
            embeds: [
                new dsc.EmbedBuilder()
                    .setTitle(`📢 Masz warna, ${targetUser.username}!`)
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
                            name: 'Powód',
                            value: reason,
                            inline: false,
                        },
                    )
                    .setColor(0x00ff00),
            ],
        });
    }
}