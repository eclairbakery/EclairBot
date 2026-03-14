import * as log from '@/util/log.js';
import * as dsc from 'discord.js';
import { output } from '@/bot/logging.js';

import { cfg } from '@/bot/cfg.js';
import { CommandFlags } from '@/bot/apis/commands/misc.js';
import { commands } from '@/cmd/list.js';

import canExecuteCmd from '@/util/cmd/canExecuteCmd.js';
import findCommand from '@/util/cmd/findCommand.js';

import isCommandBlockedOnChannel from '@/util/cmd/isCommandBlockedOnChannel.js';
import actionsManager, { PredefinedActionEventTypes } from '../actions/index.js';

import { findCmdConfResolvable } from '@/util/cmd/findCmdConfigObj.js';
import { PredefinedColors } from '@/util/color.js';

import { handleError } from './helpers/errorHandler.js';
import { makeCommandApi } from './helpers/makeCommandApi.js';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.js';

function waitForButton(interaction: dsc.Message, buttonId: string, time = 15000) {
    return new Promise((resolve, reject) => {
        const collector = interaction.channel.createMessageComponentCollector({
            filter: function (i) {return i.customId === buttonId && i.user.id === interaction.author.id},
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

async function legacyCommandsMessageHandler(msg: dsc.OmitPartialGroupDMChannel<dsc.Message<boolean>>) {
    if (!(msg instanceof dsc.Message)) return;

    const content = msg.content.trimStart();

    const prefixes = [
        cfg.commands.prefix,
        ...(cfg.commands.alternativePrefixes ?? [])
    ];
    
    const prefix = prefixes.find(p =>
        content.toLowerCase().startsWith(p.toLowerCase())
    );
    
    if (!prefix) return;
    
    const argsRaw = content
      .slice(prefix.length)
      .trim()
      .split(' ');
    
    const cmdName = (argsRaw.shift() ?? "").toLowerCase(); 

    const result = findCommand(cmdName, commands);
    if (!result) {
        return log.replyError(msg, 'Nie znam takiej komendy', 'Komenda \`<cmd>\` nie istnieje'.replace('<cmd>', cmdName.replaceAll('`', '')));
    }

    const { command, config } = result;

    if (!canExecuteCmd(command, msg.member!)) {
        log.replyError(
            msg,
            'Hej, a co ty odpie*dalasz?',
            'Wiesz że nie masz uprawnień? Poczekaj aż hubix się tobą zajmie...'
        );
        return;
    }

    const isBlocked = isCommandBlockedOnChannel(command, msg.channelId, !msg.inGuild());
    if (isBlocked) {
        await msg.react('❌');
        return;
    }

    if (!msg.inGuild() && !(command.flags & CommandFlags.WorksInDM)) {
        log.replyError(
            msg,
            'Ta komenda nie jest przeznaczona do tego trybu gadania!',
            'Taka komenda jak \`<cmd>\` może być wykonana tylko na serwerach no sorki no!'.replace('<cmd>', cmdName.replaceAll('`', ''))
        );
        return;
    }

    if (
        (cfg.commands.confirmUnsafeCommands && (command.flags & CommandFlags.Unsafe)) ||
        (cfg.commands.confirmDeprecatedCommands && (command.flags & CommandFlags.Deprecated))
    ) {
        const row = new dsc.ActionRowBuilder()
        .addComponents(
            new dsc.ButtonBuilder()
            .setCustomId('confirm')
            .setLabel('Tak, uruchom')
            .setStyle(dsc.ButtonStyle.Danger)
        );

        const reply = await msg.reply({ embeds: [
            new ReplyEmbed()
                .setColor(PredefinedColors.Red)
                .setTitle('Czy na pewno chcesz uruchomić tą komendę?')
                .setDescription(`Została ona oznaczona jako ${
                    ((command.flags & CommandFlags.Unsafe) && (command.flags & CommandFlags.Deprecated))
                        ? 'potencjalnie niebezpieczna i przestarzała'
                        : (command.flags & CommandFlags.Deprecated) ? 'przestarzała' : 'potencjalnie niebezpieczna'
                }.`)
        ], components: [row.toJSON()] });

        try {
            await waitForButton(msg, 'confirm', 20000);
            try {
                reply.delete();
            } catch {}
        } catch {
            return;
        }
    }

    if (!config.enabled && command.name != 'configuration') {
        log.replyWarn(
            msg,
            'Ta komenda jest wyłączona',
            'Eklerka coś tam gadał, że go wkurza bloat, więc dodałem wyłączanie komend. Trzeba będzie wszystko dodać jako możliwe do wyłączenia w konfiguracji XD.'
        );
        return;
    }

    let isDisallowed = false;

    if (config.disallowedRoles) {
        for (const role of config.disallowedRoles) {
            if (isDisallowed) break;
            isDisallowed ||= msg.member?.roles.cache.has(role) ?? false;
        }
    }
    if (config.disallowedUsers && config.disallowedUsers.includes(msg.author.id)) {
        isDisallowed = true;
    }

    if (isDisallowed) {
        return await log.replyWarn(msg, 'Nie dla psa kiełbasa...', 'Niestety ktoś mądry pomyślał, by specjalnie dla ciebie wyłączyć tę komendę.');
    }

    try {
        const api = await makeCommandApi(command, argsRaw, {
            msg,
            guild: msg.guild ?? undefined,
            cmd: command,
            invokedviaalias: cmdName
        });
        await command.execute(api);
    } catch (err) {
        handleError(err, msg);
    }
}

export function init() {
    actionsManager.addAction({
        callbacks: [legacyCommandsMessageHandler],
        constraints: [
            (msg) => [cfg.commands.prefix, ...cfg.commands.alternativePrefixes].some((val) => msg.content.toLowerCase().startsWith(val.toLowerCase()))
        ],
        activationEventType: PredefinedActionEventTypes.OnMessageCreate
    });
    output.log('Legacy commands event registered');
}
