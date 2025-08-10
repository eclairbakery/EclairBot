import { Command } from '../../bot/command';
import { cfg } from '../../bot/cfg';
import { db, sqlite } from '../../bot/db';

import * as log from '../../util/log';
import * as cfgManager from '../../bot/cfgManager';
import * as automod from '../../bot/automod';

import * as dsc from 'discord.js';
import { PredefinedColors } from '../../util/color';
import { likeInASentence } from '../../util/lias';

export const helpCmd: Command = {
    name: 'help',
    desc: 'Pokazuje losowe komendy z bota, by w końcu nauczyć Twojego zapyziałego mózgu jego używania.',
    category: 'ogólne',
    expectedArgs: [],
    aliases: [],
    allowedRoles: null,
    allowedUsers: [],

    async execute(msg, args, commands) {
        let blockedCmds: string[] = [];
        const commandsByCategory: Record<string, dsc.APIEmbedField[]> = {};
        
        commands.forEach((command) => {
            if (
                command.allowedRoles != null &&
                !msg.member.roles.cache.some((role) => command.allowedRoles!.includes(role.id))
            ) {
                blockedCmds.push(`\`${command.name}\``);
                return;
            }

            if (!commandsByCategory[command.category]) {
                commandsByCategory[command.category] = [];
            }

            commandsByCategory[command.category].push({
                name: `:star: ${cfg.general.prefix}${command.name}`,
                value: `**Opis**: ${command.desc}`,
            });
        });

        const blockedInfoField: dsc.APIEmbedField | null =
            blockedCmds.length > 0
                ? {
                      name: ':confused: Mała informacja na początek!',
                      value: `Pominąłem niektóre komendy, ponieważ wiem, iż nie możesz ich użyć. Te komendy to: ${blockedCmds.join(', ')}.`,
                  }
                : null;

        const embeds: dsc.EmbedBuilder[] = [];
        
        embeds.push(new dsc.EmbedBuilder()
            .setTitle('📢 Moje komendy, władzco!')
            .setDescription('Proszę o to komendy o które pan prosił. Jesteś kobietą? No to prawdopodobnie nie zrozumiesz propagandy tego serwera.')
            .setColor(PredefinedColors.Cyan)
        );

        const categoryColors: {[key: string]: PredefinedColors} = {
            'ogólne': PredefinedColors.Brown,
            'moderacyjne rzeczy': PredefinedColors.Orange
        };

        for (const [category, fields] of Object.entries(commandsByCategory)) {
            const embed = new dsc.EmbedBuilder()
                .setTitle(`📂 ${likeInASentence(category)}`)
                .setColor(categoryColors[category] ?? PredefinedColors.Green)
                .setFields(fields);

            embeds.push(embed);
        }

        if (blockedInfoField && embeds.length > 0) {
            const existingFields = embeds[0].data.fields ?? [];
            embeds[0].setFields([blockedInfoField, ...existingFields]);
        }

        await msg.reply({ embeds });
    },
};