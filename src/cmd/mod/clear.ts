import { cfg } from '@/bot/cfg.js';
import * as dsc from 'discord.js';
import * as log from '@/util/log.js';
import { PredefinedColors } from '@/util/color.js';
import { Command, CommandAPI, CommandFlags } from '@/bot/command.js';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.js';

const cmdCfg = cfg.commands.mod.warn;

export const clearCmd: Command = {
    name: 'clear',
    aliases: cmdCfg.aliases,
    description: {
        main: 'Ktoś spami? Ta komenda pomoże Ci ogarnąć usuwanie wiadomości!',
        short: 'Wywala wiadomości!',
    },
    flags: CommandFlags.Important,

    expectedArgs: [
        {
            type: 'number',
            optional: false,
            name: 'amount',
            description: 'Liczba wiadomości do usunięcia',
        },
        {
            type: 'user-mention',
            optional: true,
            name: 'user',
            description: 'Opcjonalnie, usuń wiadomości tylko tego użytkownika',
        }
    ],
    permissions: {
        discordPerms: null,
        allowedRoles: cmdCfg.allowedRoles,
        allowedUsers: cmdCfg.allowedUsers,
    },

    async execute(api: CommandAPI) {
        const amount = api.getTypedArg('amount', 'number')?.value as number;
        const who = api.getTypedArg('user', 'user-mention')?.value as dsc.GuildMember;

        if (!amount || amount < 1) {
            return api.reply({
                embeds: [
                    new ReplyEmbed()
                        .setTitle('Hej!')
                        .setDescription('Pierwszy argument to liczba wiadomości do usunięcia!')
                        .setColor(PredefinedColors.Red),
                ],
            });
        }

        const channel = api.msg.channel as dsc.TextChannel;

        if (who) {
            const fetched = await channel.messages.fetch({ limit: 100 });
            const filtered = fetched
                .filter(m => m.author.id === who.id && m.id !== api.msg.author.id)
                .first(amount);

            await channel.bulkDelete(filtered, true);
        } else {
            const fetched = await channel.messages.fetch({ limit: amount + 1 });
            await channel.bulkDelete(fetched, true);
        }

        if (api.channel.isSendable()) await api.channel.send({
            embeds: [
                new ReplyEmbed()
                    .setTitle('Już!')
                    .setDescription(`Usunąłem ${amount} wiadomości${who ? ` od ${who.user.tag}` : ''}.`)
                    .setColor(PredefinedColors.YellowGreen),
            ],
        });
    }
};
