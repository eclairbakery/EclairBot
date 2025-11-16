import * as dsc from 'discord.js';
import { db } from '@/bot/apis/db/bot-db.js';
import { cfg } from '@/bot/cfg.js';
import { PredefinedColors } from '@/util/color.js';
import { scheduleWarnDeletion } from '@/features/deleteExpiredWarns.js';
import { sendLog } from '../log/send-log.js';

export default async function ban(
    member: dsc.GuildMember,
    data: { reason: string; mod: dsc.Snowflake; }
): Promise<dsc.GuildMember> {
    try {
        await member.send({
            embeds: [
                new dsc.EmbedBuilder()
                    .setTitle('📢 Zostałeś zbanowany z serwera Piekarnia eklerki!')
                    .setDescription(`To straszne wiem. Powód bana brzmi: ${data.reason}`)
                    .setColor(PredefinedColors.Orange)
            ]
        });
    } catch {}
    const bannedMember = await member.ban({ reason: data.reason });
    await sendLog(
        {
            color: PredefinedColors.DarkGrey,
            title: 'Zbanowano członka',
            description: `Użytkownik <@${member.id}> (${member.user.username}) został zbanowany z serwera przez <@${data.mod}>!`,
            fields: [{ name: 'Powód', value: data.reason }]
        }
    );
    return bannedMember;
}
