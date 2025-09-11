import * as dsc from 'discord.js';
import { db } from '@/bot/db.js';
import { cfg } from '@/bot/cfg.js';
import { PredefinedColors } from '@/util/color.js';
import { scheduleWarnDeletion } from '@/features/deleteExpiredWarns.js';

export default function warn(
    member: dsc.GuildMember,
    data: { reason: string; expiresAt: number | null; points: number }
): Promise<{ id: number }> {
    return new Promise((resolve, reject) => {
        db.run(
            'INSERT INTO warns (user_id, moderator_id, reason_string, points, expires_at) VALUES (?, ?, ?, ?, ?)',
            [member.id, null, data.reason, data.points, data.expiresAt],
            function (err) {
                if (err) {
                    reject(err);
                    return;
                }

                const warnId = this.lastID;

                if (data.expiresAt) {
                    scheduleWarnDeletion(warnId, data.expiresAt);
                }

                member.client.channels.fetch(cfg.logs.channel).then(channel => {
                    if (channel && channel.isSendable()) {
                        channel.send({
                            embeds: [
                                new dsc.EmbedBuilder()
                                    .setAuthor({ name: 'EclairBOT' })
                                    .setColor(PredefinedColors.Orange)
                                    .setTitle('Użytkownik dostał warna')
                                    .setDescription(`Użytkownik <@${member.id}> dostał warna w wysokości ${data.points} pkt.`)
                                    .addFields({ name: 'Powód', value: data.reason })
                            ]
                        });
                    }
                }).catch(() => {});

                resolve({ id: warnId });
            }
        );
    });
}