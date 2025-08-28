import { Command } from '../../bot/command.js';
import { cfg } from '../../bot/cfg.js'
import { db, sqlite } from '../../bot/db.js';

import * as log from '../../util/log.js';
import * as dsc from 'discord.js';

import { PredefinedColors } from '../../util/color.js';

const cmdCfg = cfg.mod.commands.warn;

export const clearCmd: Command = {
    name: 'clear',
    longDesc: 'Ktoś spami? Ta komenda pomoże Ci ogarnąć usuwanie wiadomości!',
    shortDesc: 'Wywala wiadomości!',
    expectedArgs: [],

    aliases: cmdCfg.aliases,
    allowedRoles: cmdCfg.allowedRoles,
    allowedUsers: cmdCfg.allowedUsers,

    async execute(msg, args) {
        if (!args[0]) {
            msg.reply({
                embeds: [
                    new dsc.EmbedBuilder()
                        .setTitle(`Hej!`)
                        .setDescription(
                            `Jako pierwszy argument się podaje yyyyy liczbę wiadomości do usunięcia!`,
                        )
                        .setColor(PredefinedColors.Red),
                ],
            });
        }
        const how_much = parseInt(args[0]);
        if (isNaN(how_much) || how_much < 1) {
            return msg.reply({
                embeds: [
                    new dsc.EmbedBuilder()
                        .setTitle(`Hej!`)
                        .setDescription(`Pierwszy argument to liczba wiadomości do usunięcia!`)
                        .setColor(PredefinedColors.Red),
                ],
            });
        }

        const who = msg.mentions.users.first();

        if (who) {
            const fetched = await msg.channel.messages.fetch({ limit: 100 });
            const filtered = fetched
                .filter(m => m.author.id === who.id && m.id !== msg.id)
                .first(how_much);

            await (msg.channel as dsc.TextChannel).bulkDelete(filtered, true);
        } else {
            const fetched = await msg.channel.messages.fetch({ limit: how_much + 1 });
            await (msg.channel as dsc.TextChannel).bulkDelete(fetched.filter(m => m.id !== msg.id), true);
        }

        await msg.reply({
            embeds: [
                new dsc.EmbedBuilder()
                    .setTitle(`Już!`)
                    .setDescription(`Usunąłem ${how_much} wiadomości${who ? ` od ${who}` : ''}.`)
                    .setColor(PredefinedColors.YellowGreen),
            ],
        });
    }
}