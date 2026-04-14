import { CommandFlags } from '@/bot/apis/commands/misc.ts';
import { Command } from '@/bot/command.ts';
import { CommandPermissions } from '@/bot/apis/commands/permissions.ts';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.ts';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import process from 'node:process';

export const watchTogetherCommand: Command = {
    name: 'host-wt',
    aliases: [],
    description: {
        main: 'Hostujesz Watch Together na kanale głosowym i zapraszasz innych do dołączenia do zabawy.',
        short: 'Generuje invite do Watch Together'
    },

    flags: CommandFlags.Unsafe,
    permissions: CommandPermissions.everyone(),

    expectedArgs: [],

    async execute(api) {
        if (!api.invoker.member!.voice.channel) {
            return api.log.replyError(api, 'Błąd', 'Skąd ja mam wiedzieć gdzie ty chcesz to hostować? Weź może najlepiej dołącz na kanał głosowy.');
        }

        const inv: { code: string } = await (await fetch(
            `https://discord.com/api/v10/channels/${api.invoker.member!.voice.channel.id}/invites`,
            {
                body: JSON.stringify({
                    max_age: 10800,
                    max_uses: 0,
                    target_application_id: '880218394199220334',
                    target_type: 2,
                    temporary: false,
                    validate: null
                }),
                headers: {
                    'Authorization': `Bot ${process.env.TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        )).json();

        if (typeof inv !== "object" || !('code' in inv) || typeof inv.code !== 'string')
            return api.log.replyError(api, 'Błąd', 'Discord coś źle wysłał nam i tego invite nie zrobię.');

        const url = `https://discord.gg/${inv.code}`;

        return await api.reply({
            embeds: [
                new ReplyEmbed()
                    .setTitle('Watch Together')
                    .setURL(url)
                    .setDescription(
                        'No więc invite zrobiłem, na razie jeszcze nie mogę hostować (szkoda), więc po prostu użyjcie mego linku by dołączyć.\n' 
                        + url
                    )
            ],
            components: [
                new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setURL(url)
                        .setLabel('Join Activity')
                        .setStyle(ButtonStyle.Link)
                )
            ]
        });
    },
};
