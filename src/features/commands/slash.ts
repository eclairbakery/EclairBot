import { output as debug } from '@/bot/logging.ts';

import { Interaction } from 'discord.js';
import * as dsc from 'discord.js';
import * as log from '@/util/log.ts';

import { cfg } from '@/bot/cfg.ts';
import { CommandFlags } from '@/bot/apis/commands/misc.ts';
import { client } from '../../client.ts';
import { commands } from '../../cmd/list.ts';
import { handleError } from './helpers/error-handler.ts';
import { makeCommandApi } from './helpers/makeCommandApi.ts';
import { makeSlashCommandDesc, makeSlashCommandOptionDesc } from './helpers/makeSlashCommandDescs.ts';
import { formatArgType } from './helpers/fmt-arg-type.ts';

import findCommand from '@/util/cmd/findCommand.ts';
import canExecuteCmd from '@/util/cmd/canExecuteCmd.ts';
import isCommandBlockedOnChannel from '@/util/cmd/isCommandBlockedOnChannel.ts';
import process from "node:process";


import { ParsedRawArgument } from './helpers/argumentParser.ts';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.ts';
import { PredefinedColors } from '@/util/color.ts';
import { CommandArgType } from '../../bot/command.ts';

function waitForButton(int: dsc.ChatInputCommandInteraction, buttonId: string, time = 15000) {
    return new Promise((resolve, reject) => {
        const collector = int.channel!.createMessageComponentCollector({
            filter: function (i) {
                return i.customId === buttonId && i.user.id === int.user.id;
            },
            time,
        });

        collector.on('collect', async (i) => {
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
    if (int.isAutocomplete()) {
        const result = findCommand(int.commandName, commands);
        if (!result) return;

        const { command } = result;
        const focusedOption = int.options.getFocused(true);
        const arg = command.expectedArgs.find((a) => a.name === focusedOption.name);
        if (!arg) return;

        const type = fixType(arg.type);
        if (type.base == 'command-ref') {
            const allCommands = new Set<string>();
            for (const [, cmds] of commands) {
                for (const c of cmds) {
                    allCommands.add(c.name);
                    for (const a of c.aliases) allCommands.add(a);
                }
            }
            const filtered = Array.from(allCommands)
                .filter((c) => c.toLowerCase().includes(focusedOption.value.toLowerCase()))
                .slice(0, 25);
            await int.respond(filtered.map((c) => ({ name: c, value: c })));
        } else if (type.base == 'enum' && type.options.length > 25) {
            const filtered = type.options
                .filter((o) => o.toLowerCase().includes(focusedOption.value.toLowerCase()))
                .slice(0, 25);
            await int.respond(filtered.map((o) => ({ name: o, value: o })));
        }
        return;
    }

    if (!int.isChatInputCommand()) return;

    const result = findCommand(int.commandName, commands);
    if (!result) {
        return int.reply({ content: 'Nie znam takiej komendy', ephemeral: true });
    }

    const { command, config } = result;

    const replyable: log.Replyable = {
        reply: async (options) => {
            if (int.replied || int.deferred) {
                return await int.editReply(options);
            }
            await int.reply(options);
            return await int.fetchReply();
        },
    };

    if (!canExecuteCmd(command, int.member! as dsc.GuildMember)) {
        return log.replyError(
            replyable,
            'Hej, a co ty odpie*dalasz?',
            'Wiesz że nie masz uprawnień? Poczekaj aż hubix się tobą zajmie...',
        );
    }

    const isBlocked = isCommandBlockedOnChannel(command, int.channelId, !int.guild);
    if (isBlocked) {
        return int.reply({ content: '❌', ephemeral: true });
    }

    if (!int.guild && !(command.flags & CommandFlags.WorksInDM)) {
        return log.replyError(
            replyable,
            'Ta komenda nie jest przeznaczona do tego trybu gadania!',
            `Taka komenda jak **${command.name}** może być wykonana tylko na serwerach no sorki no!`,
        );
    }

    if (
        (cfg.commands.confirmUnsafeCommands && (command.flags & CommandFlags.Unsafe)) ||
        (cfg.commands.confirmDeprecatedCommands && (command.flags & CommandFlags.Deprecated))
    ) {
        const row = new dsc.ActionRowBuilder<dsc.ButtonBuilder>()
            .addComponents(
                new dsc.ButtonBuilder()
                    .setCustomId('confirm')
                    .setLabel('Tak, uruchom')
                    .setStyle(dsc.ButtonStyle.Danger),
            );

        await int.reply({
            embeds: [
                new ReplyEmbed()
                    .setColor(PredefinedColors.Red)
                    .setTitle('Czy na pewno chcesz uruchomić tą komendę?')
                    .setDescription(`Została ona oznaczona jako ${((command.flags & CommandFlags.Unsafe) && (command.flags & CommandFlags.Deprecated)) ? 'potencjalnie niebezpieczna i przestarzała' : (command.flags & CommandFlags.Deprecated) ? 'przestarzała' : 'potencjalnie niebezpieczna'}.`),
            ],
            components: [row],
        });

        try {
            await waitForButton(int, 'confirm', 20000);
            await int.editReply({ components: [], embeds: [], content: '⏳' });
        } catch {
            return;
        }
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
        const argsRaw: ParsedRawArgument[] = [];
        for (const arg of command.expectedArgs) {
            const val = int.options.get(arg.name)?.value;
            if (val) {
                argsRaw.push({
                    type: 'text',
                    precedingWhitespace: '',
                    value: val.toString(),
                });
            }
        }

        const api = await makeCommandApi(command, argsRaw, {
            interaction: int,
            cmd: command,
            guild: int.guild ?? undefined,
            invokedviaalias: int.commandName,
        });
        await command.execute(api);
    } catch (err) {
        // deno-lint-ignore no-explicit-any
        handleError(err, { reply: (options: any) => int.editReply(options as any) });
    }
});

function typeThatImpliesAllUnionVariants(_union: CommandArgType & { base: 'union' }): CommandArgType {
    // TODO
    return { base: 'string' };
}

function fixType(type: CommandArgType): CommandArgType {
    if (type.base == 'union') {
        return typeThatImpliesAllUnionVariants(type);
    }
    return type;
}

export async function init() {
    const commandsArray: dsc.RESTPostAPIApplicationCommandsJSONBody[] = [];
    const rest = new dsc.REST({ version: '10' }).setToken(process.env.TOKEN!);

    for (const [, cmds] of commands) {
        for (const cmd of cmds) {
            const scb = new dsc.SlashCommandBuilder()
                .setName(cmd.name)
                .setDescription(makeSlashCommandDesc(cmd));

            const sortedArgs = [];
            for (const arg of cmd.expectedArgs) {
                if (!arg.optional) sortedArgs.push(arg);
            }
            for (const arg of cmd.expectedArgs)
                if (arg.optional) sortedArgs.push(arg);

            for (const arg of sortedArgs) {
                const type = fixType(arg.type);

                switch (type.base) {
                case 'timestamp':
                case 'string':
                case 'code': {
                    const defaultDesc = type.base == 'timestamp'
                        ? 'Podaj czas (timestamp jak np. 10s, 15m)'
                        : 'Podaj tekst jakiś';

                    scb.addStringOption((option) =>
                        option
                            .setName(arg.name)
                            .setDescription(makeSlashCommandOptionDesc(arg, defaultDesc))
                            .setRequired(!arg.optional)
                    );
                    break;
                }

                case 'money':
                case 'float':
                case 'int': {
                    const defaultDesc = type.base == 'money' ? 'Podaj ilość pieniędzy' : 'Podaj liczbę';
                    scb.addNumberOption((option) =>
                        option
                            .setName(arg.name)
                            .setDescription(makeSlashCommandOptionDesc(arg, defaultDesc))
                            .setRequired(!arg.optional)
                    );
                    break;
                }

                case 'user-mention':
                    scb.addUserOption((option) =>
                        option
                            .setName(arg.name)
                            .setDescription(makeSlashCommandOptionDesc(arg, 'Wskaż użytkownika'))
                            .setRequired(!arg.optional)
                    );
                    break;
                case 'role-mention':
                    scb.addRoleOption((option) =>
                        option
                            .setName(arg.name)
                            .setDescription(makeSlashCommandOptionDesc(arg, 'Wskaż rolę'))
                            .setRequired(!arg.optional)
                    );
                    break;
                case 'channel-mention':
                    scb.addChannelOption((option) =>
                        option
                            .setName(arg.name)
                            .setDescription(makeSlashCommandOptionDesc(arg, 'Wskaż kanał'))
                            .setRequired(!arg.optional)
                    );
                    break;

                case 'command-ref':
                    scb.addStringOption((option) =>
                        option
                            .setName(arg.name)
                            .setDescription(makeSlashCommandOptionDesc(arg, 'Wskaż komendę'))
                            .setRequired(!arg.optional)
                            .setAutocomplete(true)
                    );
                    break;
                case 'enum':
                    scb.addStringOption((option) => {
                        option
                            .setName(arg.name)
                            .setDescription(makeSlashCommandOptionDesc(arg, 'Wybierz opcję, ' + formatArgType(type)))
                            .setRequired(!arg.optional);

                        if (type.options.length <= 25) {
                            option.addChoices(type.options.map((o) => ({ name: o, value: o })));
                        } else {
                            option.setAutocomplete(true);
                        }
                        return option;
                    });
                    break;
                }
            }

            commandsArray.push(scb.toJSON());
        }
    }

    try {
        await rest.put(
            dsc.Routes.applicationCommands(client.application!.id),
            { body: commandsArray },
        );
        debug.verbose('Slash commands registered');
    } catch (err) {
        debug.err('Slash commands error: ' + err);
    }
}
