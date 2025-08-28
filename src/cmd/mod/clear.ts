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
        if (isNaN(how_much)) {
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
        const messages = await msg.channel.messages.fetch({ limit: how_much + 1 });
        await (msg.channel as dsc.TextChannel).bulkDelete(messages.filter(m => m.id !== msg.id), true);
        msg.reply({
            embeds: [
                new dsc.EmbedBuilder()
                    .setTitle(`Już!`)
                    .setDescription(
                        `Wywaliłem!`,
                    )
                    .setColor(PredefinedColors.YellowGreen),
            ],
        });
    }
}