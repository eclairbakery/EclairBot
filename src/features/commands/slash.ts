import {output as debug} from '@/bot/logging.js';

import { Interaction } from 'discord.js';
import * as dsc from 'discord.js';
import * as log from '@/util/log.js';

import { cfg } from '@/bot/cfg.js';
import { CommandFlags } from '@/bot/command.js';
import { client } from '../../client.js';
import { commands } from '../../cmd/list.js';
import { handleError } from './helpers/errorHandler.js';
import { makeCommandApi } from './helpers/makeCommandApi.js';
import { makeSlashCommandDesc, makeSlashCommandOptionDesc } from './helpers/makeSlashCommandDescs.js';

import findCommand from '@/util/cmd/findCommand.js';
import canExecuteCmd from '@/util/cmd/canExecuteCmd.js';
import isCommandBlockedOnChannel from '@/util/cmd/isCommandBlockedOnChannel.js';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.js';
import { PredefinedColors } from '@/util/color.js';

function waitForButton(int: dsc.ChatInputCommandInteraction, buttonId: string, time = 15000) {
    return new Promise((resolve, reject) => {
        const collector = int.channel!.createMessageComponentCollector({
            filter: function (i) {return i.customId === buttonId && i.user.id === int.user.id},
            time
        });

        collector.on('collect', async i => {
            await i.deferUpdate(); 
            collector.stop('clicked');
            resolve(i); 
        });

        collector.on('end', (_, reason) => {
            if (reason !== 'clicked') {
                reject(new Error('Button not clicked in time'));
            }
        });
    });
}

client.on('interactionCreate', async (int: Interaction) => {
    if (!int.isChatInputCommand()) return;

    const result = findCommand(int.commandName, commands);
    if (!result) {
        return int.reply({ content: cfg.legacy.customization.commandsErrors.slash.commandNotFound, ephemeral: true });
    }

    const { command, config } = result;

    const replyable: log.Replyable = {
        reply: async (options: any) => {
            if (int.replied || int.deferred) {
                return await int.editReply(options);
            }
            await int.reply(options);
            return await int.fetchReply();
        }
    };

    if (!canExecuteCmd(command, int.member! as any)) {
        return log.replyError(
            replyable,
            cfg.legacy.customization.commandsErrors.legacy.missingPermissionsHeader,
            cfg.legacy.customization.commandsErrors.legacy.missingPermissionsText
        );
    }

    const isBlocked = isCommandBlockedOnChannel(command, int.channelId, !int.guild);
    if (isBlocked) {
        return int.reply({ content: '❌', ephemeral: true });
    }

    if (!int.guild && !(command.flags & CommandFlags.WorksInDM)) {
        return log.replyError(
            replyable, 'Ta komenda nie jest przeznaczona do tego trybu gadania!',
            `Taka komenda jak **${command.name}** może być wykonana tylko na serwerach no sorki no!`,
        );
    }

    if (
        (cfg.legacy.general.commandHandling.confirmUnsafeCommands && (command.flags & CommandFlags.Unsafe)) ||
        (cfg.legacy.general.commandHandling.confirmDeprecatedCommands && (command.flags & CommandFlags.Deprecated))
    ) { 
        const row = new dsc.ActionRowBuilder<dsc.ButtonBuilder>()
            .addComponents(
                new dsc.ButtonBuilder()
                .setCustomId('confirm')
                .setLabel('Tak, uruchom')
                .setStyle(dsc.ButtonStyle.Danger)
            );

        await int.reply({ embeds: [
            new ReplyEmbed()
                .setColor(PredefinedColors.Red)
                .setTitle('Czy na pewno chcesz uruchomić tą komendę?')
                .setDescription(`Została ona oznaczona jako ${
                    ((command.flags & CommandFlags.Unsafe) && (command.flags & CommandFlags.Deprecated))
                        ? 'potencjalnie niebezpieczna i przestarzała'
                        : (command.flags & CommandFlags.Deprecated) ? 'przestarzała' : 'potencjalnie niebezpieczna'
                }.`)
        ], components: [row] });

        try {
            await waitForButton(int, 'confirm', 20000);
            await int.editReply({ components: [], embeds: [], content: '⏳' }); 
        } catch {
            return;
        }
    }

    if (!config.enabled && command.name != 'configuration') {
        return log.replyWarn(
            replyable,
            cfg.legacy.customization.commandsErrors.legacy.commandDisabledHeader,
            cfg.legacy.customization.commandsErrors.legacy.commandDisabledDescription
        );
    }

    let isDisallowed = false;

    if (config.disallowedRoles && int.member) {
        const member = int.member as dsc.GuildMember;
        for (const role of config.disallowedRoles) {
            if (isDisallowed) break;
            isDisallowed ||= member.roles.cache.has(role);
        }
    }
    if (config.disallowedUsers && config.disallowedUsers.includes(int.user.id)) {
        isDisallowed = true;
    }

    if (isDisallowed) {
        return await log.replyWarn(replyable, 'Nie dla psa kiełbasa...', 'Niestety ktoś mądry pomyślał, by specjalnie dla ciebie wyłączyć tę komendę.');
    }

    if (!int.deferred && !int.replied) {
        await int.deferReply();
    }

    try {
        const argsRaw = command.expectedArgs.map(arg => int.options.get(arg.name)?.value?.toString() ?? '');
        const api = await makeCommandApi(command, argsRaw, {
            interaction: int,
            cmd: command,
            guild: int.guild ?? undefined,
            invokedviaalias: int.commandName
        });
        await command.execute(api);

    } catch (err) {
        handleError(err, { reply: (options: any) => int.editReply(options as any), });
    }
});

export async function init() {
    const commandsArray: dsc.RESTPostAPIApplicationCommandsJSONBody[] = [];
    const rest = new dsc.REST({ version: '10' }).setToken(process.env.TOKEN!);

    for (const [, cmds] of commands) {
        for (const cmd of cmds) {
            const scb = new dsc.SlashCommandBuilder()
                .setName(cmd.name)
                .setDescription(makeSlashCommandDesc(cmd));

            for (const arg of cmd.expectedArgs) {
                const types = Array.isArray(arg.type) ? arg.type : [arg.type];
                const type = types[0]; // Use first type for slash command representation

                switch (type.base) {
                case 'string':
                    scb.addStringOption(option =>
                        option
                            .setName(arg.name)
                            .setDescription(makeSlashCommandOptionDesc(arg, 'Podaj wartość'))
                            .setRequired(!arg.optional)
                    );
                    break;

                case 'float':
                case 'int':
                    scb.addNumberOption(option =>
                        option
                            .setName(arg.name)
                            .setDescription(makeSlashCommandOptionDesc(arg, 'Podaj liczbę'))
                            .setRequired(!arg.optional)
                    );
                    break;

                case 'user-mention':
                    scb.addStringOption(option =>
                        option
                            .setName(arg.name)
                            .setDescription(makeSlashCommandOptionDesc(arg, 'Wskaż użytkownika'))
                            .setRequired(!arg.optional)
                    );
                    break;

                case 'role-mention':
                    scb.addRoleOption(option =>
                        option
                            .setName(arg.name)
                            .setDescription(makeSlashCommandOptionDesc(arg, 'Wskaż rolę'))
                            .setRequired(!arg.optional)
                    );
                    break;

                case 'channel-mention':
                    scb.addChannelOption(option =>
                        option
                            .setName(arg.name)
                            .setDescription(makeSlashCommandOptionDesc(arg, 'Wskaż kanał'))
                            .setRequired(!arg.optional)
                    );
                    break;

                case 'timestamp':
                    scb.addStringOption(option =>
                        option
                            .setName(arg.name)
                            .setDescription(makeSlashCommandOptionDesc(arg, 'Podaj czas (timestamp)'))
                            .setRequired(!arg.optional)
                    );
                    break;
                }
            }

            commandsArray.push(scb.toJSON());
        }
    }

    try {
        await rest.put(
            dsc.Routes.applicationCommands(client.application!.id),
            { body: commandsArray }
        );
        debug.log('Slash commands registered');
    } catch (err) {
        debug.err('Slash commands error: ' + err);
    }
}
