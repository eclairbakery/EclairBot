import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.js';
import { cfg } from '@/bot/cfg.js';
import { Command, CommandFlags } from '@/bot/command.js';
import { commandPerformance, commandPerformanceNumber } from '@/features/commands/helpers/commandPerformance.js';
import { PredefinedColors } from '@/util/color.js';

export const ebinfoCmd: Command = {
    name: 'ebinfo',
    description: {
        main: 'Bardzo ciekawa komenda która pokaże ci prawdę. Przynajmniej o eclairbocie.',
        short: 'Pokazuje użyteczne informacje o bocie.',
    },
    flags: CommandFlags.Important,

    expectedArgs: [],
    aliases: [],
    permissions: {
        discordPerms: [],
        allowedRoles: null,
        allowedUsers: null,
    },

    async execute(api) {
        if (api.preferShortenedEmbeds) {
            return api.reply(`<#${cfg.channels.general.commands}> bo to mega spami`);
        }
        let num_total = 0;
        commandPerformance.forEach((v) => num_total += v);
        api.reply({
            embeds: [
                new ReplyEmbed()
                    .setTitle('Node.JS performance API')
                    .setDescription(
                        ((performance.getEntriesByName('main_executed_end')[0].startTime < 2000) 
                            ? ':white_check_mark: EclairBOT became available under 2 seconds from launch.\n\n' 
                            : ':x: EclairBOT needs some time to power up\n\n') +
                        'With duration:\n' + 
                        performance
                            .getEntries()
                            .filter((val) => val.duration !== 0)
                            .map((val) => `- ${val.name}: ${val.startTime.toFixed(2)}ms for ${val.duration.toFixed(2)}ms`)
                            .join('\n')
                        + '\n\nBased on start time:\n' + 
                        performance
                            .getEntries()
                            .filter((val) => val.duration == 0)
                            .map((val) => `- ${val.name}: ${val.startTime.toFixed(2)}ms`)
                            .join('\n')
                    )
                    .setColor(PredefinedColors.DarkOrange),
                new ReplyEmbed()
                    .setColor(PredefinedColors.DarkGold)
                    .setTitle('Command performance')
                    .setDescription(
                        (commandPerformanceNumber < 2) 
                        ? 'Run more commands to see results'
                        : `Run ${commandPerformanceNumber} commands in this run, most of which took about ${(num_total / commandPerformanceNumber).toFixed(2)}ms to complete.`
                    )
            ]
        });
    },
};