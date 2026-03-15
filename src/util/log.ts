import { PredefinedColors } from '@/util/color.ts';
import { SendableChannel } from '../defs.ts';

import * as dsc from 'discord.js';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.ts';
import { t } from '@/bot/apis/translations/translate.ts';

export interface Replyable {
    // deno-lint-ignore no-explicit-any
    reply: (options: any) => Promise<dsc.OmitPartialGroupDMChannel<dsc.Message<boolean>> | dsc.Message<boolean>>;
}

enum LogType {
    Success,
    Info,
    Tip,
    Warn,
    Error,
}

function getEmbed(type: LogType, title: string, desc: string) {
    const settings = {
        [LogType.Success]: { emoji: '✅', color: PredefinedColors.Green },
        [LogType.Info]: { emoji: 'ℹ️', color: PredefinedColors.Cyan },
        [LogType.Tip]: { emoji: '💡', color: PredefinedColors.Purple },
        [LogType.Warn]: { emoji: '⚠️', color: PredefinedColors.Orange },
        [LogType.Error]: { emoji: '💔', color: PredefinedColors.Red },
    };

    return new ReplyEmbed()
        .setTitle(`${settings[type].emoji} ${title}`)
        .setColor(settings[type].color)
        .setAuthor({ name: 'EclairBOT' })
        .setDescription(desc);
}

export function getErrorEmbed(title: string, desc: string) {
    return getEmbed(LogType.Error, t(title), t(desc));
}

export function getWarnEmbed(title: string, desc: string) {
    return getEmbed(LogType.Warn, t(title), t(desc));
}

export function getInfoEmbed(title: string, desc: string) {
    return getEmbed(LogType.Info, t(title), t(desc));
}

export function getSuccessEmbed(title: string, desc: string) {
    return getEmbed(LogType.Success, t(title), t(desc));
}

export function getTipEmbed(title: string, desc: string) {
    return getEmbed(LogType.Tip, t(title), t(desc));
}

export async function replyError(msg: Replyable, title: string, desc: string) {
    return msg.reply({ embeds: [getErrorEmbed(title, desc)] });
}

export async function replyWarn(msg: Replyable, title: string, desc: string) {
    return msg.reply({ embeds: [getWarnEmbed(title, desc)] });
}

export async function replyInfo(msg: Replyable, title: string, desc: string) {
    return msg.reply({ embeds: [getInfoEmbed(title, desc)] });
}

export async function replySuccess(msg: Replyable, title: string, desc: string) {
    return msg.reply({ embeds: [getSuccessEmbed(title, desc)] });
}

export async function replyTip(msg: Replyable, title: string, desc: string) {
    return msg.reply({ embeds: [getTipEmbed(title, desc)] });
}

export async function sendError(channel: SendableChannel, title: string, desc: string) {
    return channel.send({ embeds: [getErrorEmbed(title, desc)] });
}

export async function sendWarn(channel: SendableChannel, title: string, desc: string) {
    return channel.send({ embeds: [getWarnEmbed(title, desc)] });
}

export async function sendInfo(channel: SendableChannel, title: string, desc: string) {
    return channel.send({ embeds: [getInfoEmbed(title, desc)] });
}

export async function sendSuccess(channel: SendableChannel, title: string, desc: string) {
    return channel.send({ embeds: [getSuccessEmbed(title, desc)] });
}

export async function sendTip(channel: SendableChannel, title: string, desc: string) {
    return channel.send({ embeds: [getTipEmbed(title, desc)] });
}
