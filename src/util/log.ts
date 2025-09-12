import { PredefinedColors, Color } from '@/util/color.js';
import { SendableChannel } from '../defs.js';

import * as dsc from 'discord.js';
import { Command, CommandAPI } from '@/bot/command.js';

enum LogType {
    Success,
    Info,
    Tip,
    Warn,
    Error,
}

function getEmbed(type: LogType, title: string, desc: string) {
    const settings = {
        [LogType.Success]: { emoji: '✅', color: PredefinedColors.Green  },
        [LogType.Info]:    { emoji: 'ℹ️', color: PredefinedColors.Cyan   },
        [LogType.Tip]:     { emoji: '💡', color: PredefinedColors.Purple },
        [LogType.Warn]:    { emoji: '⚠️', color: PredefinedColors.Orange },
        [LogType.Error]:   { emoji: '💔', color: PredefinedColors.Red    }
    };

    return new dsc.EmbedBuilder()
            .setTitle(`${settings[type].emoji} ${title}`)
            .setColor(settings[type].color)
            .setAuthor({ name: 'EclairBOT' })
            .setDescription(desc)
}

export function getErrorEmbed(title: string, desc: string) {
    return getEmbed(LogType.Error, title, desc);
}

export function getWarnEmbed(title: string, desc: string) {
    return getEmbed(LogType.Warn, title, desc);
}

export function getInfoEmbed(title: string, desc: string) {
    return getEmbed(LogType.Info, title, desc);
}

export function getSuccessEmbed(title: string, desc: string) {
    return getEmbed(LogType.Success, title, desc);
}

export function getTipEmbed(title: string, desc: string) {
    return getEmbed(LogType.Tip, title, desc);
}


export function replyError(msg: dsc.Message | CommandAPI['msg'], title: string, desc: string) {
    msg.reply({ embeds: [getErrorEmbed(title, desc)] });
}

export function replyWarn(msg: dsc.Message | CommandAPI['msg'], title: string, desc: string) {
    msg.reply({ embeds: [getWarnEmbed(title, desc)] });
}

export function replyInfo(msg: dsc.Message | CommandAPI['msg'], title: string, desc: string) {
    msg.reply({ embeds: [getInfoEmbed(title, desc)] });
}

export function replySuccess(msg: dsc.Message | CommandAPI['msg'], title: string, desc: string) {
    msg.reply({ embeds: [getSuccessEmbed(title, desc)] });
}

export async function replyTip(msg: dsc.Message | CommandAPI['msg'], title: string, desc: string) {
    await msg.reply({ embeds: [getTipEmbed(title, desc)] });
}

export function sendError(channel: SendableChannel, title: string, desc: string) {
    channel.send({ embeds: [getErrorEmbed(title, desc)] });
}

export function sendWarn(channel: SendableChannel, title: string, desc: string) {
    channel.send({ embeds: [getWarnEmbed(title, desc)] });
}

export function sendInfo(channel: SendableChannel, title: string, desc: string) {
    channel.send({ embeds: [getInfoEmbed(title, desc)] });
}

export function sendSuccess(channel: SendableChannel, title: string, desc: string) {
    channel.send({ embeds: [getSuccessEmbed(title, desc)] });
}

export function sendTip(channel: SendableChannel, title: string, desc: string) {
    channel.send({ embeds: [getTipEmbed(title, desc)] });
}
