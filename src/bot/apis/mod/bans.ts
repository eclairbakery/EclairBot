import * as dsc from 'discord.js';

import { PredefinedColors } from '@/util/color.ts';
import { sendLog } from '../log/send-log.ts';
import { ReplyEmbed } from '../translations/reply-embed.ts';
import User from '@/bot/apis/db/user.ts';

export default async function ban(
    member: dsc.GuildMember,
    data: { reason: string; mod: dsc.Snowflake },
): Promise<dsc.GuildMember> {
    try {
        await member.send({
            embeds: [
                new ReplyEmbed()
                    .setTitle('📢 Zostałeś zbanowany z serwera Piekarnia eklerki!')
                    .setDescription(`To straszne wiem. Powód bana brzmi: ${data.reason}\nAle jesteśmy mili. Możesz wysłać email do \`theeclairbot@gmail.com\` by sie z nami skontaktować; emaile są forwardowane na kanał dla administracji, więc są czytane czy coś`)
                    .setColor(PredefinedColors.Orange),
            ],
        });
    } catch {}
    const us = new User(member.id);
    const members = [us.id, ...(await us.fetchAlternativeAccounts())];

    let firstBannerMember: dsc.GuildMember;

    for (const mem_id of members) {
        let smember: dsc.GuildMember;
        try {
            smember = await member.guild.members.fetch(mem_id);
        } catch {
            continue;
        }

        const bannedMember = await smember.ban({ reason: `${data.reason} ~ ${data.mod}` });
        await sendLog(
            {
                color: PredefinedColors.DarkGrey,
                title: 'Zbanowano członka',
                description: `Użytkownik <@${smember.id}> (${smember.user.username}) został zbanowany z serwera przez <@${data.mod}>!`,
                fields: [{ name: 'Powód', value: data.reason }],
            },
        );
        firstBannerMember ??= bannedMember;
    }

    return firstBannerMember!;
}
