import * as dsc from 'discord.js';

import { PredefinedColors } from '@/util/color.js';
import { sendLog } from '../log/send-log.js';
import { ReplyEmbed } from '../translations/reply-embed.js';

export default async function kick(
    member: dsc.GuildMember,
    data: { reason: string; mod: dsc.Snowflake }
): Promise<dsc.GuildMember> {
    try {
        await member.send({
            embeds: [
                new ReplyEmbed()
                    .setTitle('📢 Zostałeś wywalony z serwera Piekarnia eklerki!')
                    .setDescription(`To straszne wiem. Powód kicka brzmi: ${data.reason}`)
                    .setColor(PredefinedColors.Orange)
            ]
        });
    } catch {}
    const bannedMember = member.kick(data.reason);
    sendLog({
        color: PredefinedColors.DarkGrey,
        title: 'Wywalono członka',
        description: `Użytkownik <@${member.id}> (${member.user.username}) został wyrzucony z serwera przez <@${data.mod}>!`,
        fields: [{ name: 'Powód', value: data.reason }]
    });
    return bannedMember;
}
