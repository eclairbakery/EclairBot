import { cfg } from "@/bot/cfg.js";
import { SendableChannel, Snowflake } from "../../../defs.js";
import * as dsc from 'discord.js';
import { Action, MagicSkipAllActions, MessageEventCtx, PredefinedActionEventTypes } from "../index.js";
import { client } from "../../../client.js";
import parseTimestamp from "@/util/parseTimestamp.js";
import { scheduleWarnDeletion } from "../../deleteExpiredWarns.js";
import warn from "@/bot/apis/mod/warns.js";

const userMessagesAntiSpamMap: Map<Snowflake, number[]> = new Map();
let userRecentlyInTheList: Record<Snowflake, boolean> = {};

async function filterLog(msg: dsc.Message, system: string) {
    const channel = await msg.client.channels.fetch(cfg.features.logs.channel);
    if (!channel?.isSendable()) return;
    await channel.send({
        content: '<@&1410323193763463188>',
        embeds: [
            new dsc.EmbedBuilder()
                .setAuthor({
                    name: 'EclairBOT'
                })
                .setColor(0xff0000)
                .setTitle('Wiadomość została usunięta przez filtry anti-spam/anti-flood')
                .setDescription(`Tu masz autora co nie: <@${msg.author.id}>\nA tu masz link co nie: https://discord.com/channels/${msg.guildId}/${msg.channelId}/${msg.id}`)
                .setFields([
                    {
                        name: 'Wiadomość',
                        value: msg.content.slice(1, 1020)
                    },
                    {
                        name: 'System moderacyjny',
                        value: system
                    }
                ])
        ]
    });
}

function isFlood(content: string) {
    if (!cfg.features.automod.antiFloodEnabled) return false;
    let cleaned = content
        .replace(/<@!?\d+>/g, '')
        .replace(/<@&\d+>/g, '')
        .replace(/<#\d+>/g, '')
        .trim();

    cleaned = cleaned.replace(/\b(x+d+|xd+|ej+|-+|haha+|lol+)\b/gi, '').trim();

    if (!cleaned) return false;

    const normalized = cleaned.replace(/\s+/g, '');

    const parts = cleaned.toLowerCase().split(/\s+/);
    for (let size = 2; size <= Math.min(10, Math.floor(parts.length / 2)); size++) {
        const chunk = parts.slice(0, size).join(' ');
        let repeats = 0;
        for (let i = 0; i < parts.length; i += size) {
            if (parts.slice(i, i + size).join(' ') === chunk) {
                repeats++;
            } else {
                break;
            }
        }
        if (repeats >= 5) return true;
    }

    return false;
}

export const antiSpamAndAntiFlood: Action<MessageEventCtx> = {
    activationEventType: PredefinedActionEventTypes.OnMessageCreate,
    constraints: [(msg) => { if (!msg.inGuild()) return false; else return true; }],
    callbacks: [
        async (msg) => {
            // antispam
            const antispamNow = Date.now();
            const antispamTimeframe = 4_0_0_0;
            const antispamLimit = 3;
            if (!userMessagesAntiSpamMap.has(msg.author.id)) {
                userMessagesAntiSpamMap.set(msg.author.id, []);
            }
            const timestamps = userMessagesAntiSpamMap.get(msg.author.id) ?? [];
            while (timestamps.length > 0 && antispamNow - timestamps[0] > antispamTimeframe) {
                timestamps.shift();
            }
            timestamps.push(antispamNow);
            userMessagesAntiSpamMap.set(msg.author.id, timestamps);
            if (timestamps.length > antispamLimit && client.user!.id !== msg.author.id && !userRecentlyInTheList[msg.author.id] && cfg.features.automod.antiSpamEnabled) {
                userRecentlyInTheList[msg.author.id] = true;
                await (msg.channel as SendableChannel).send(`🚨 <@${msg.author.id}> co ty odsigmiasz`);
                try {
                    await msg.member!.timeout(5 * 60 * 1000, 'co ty odsigmiasz? czemu spamisz?');
                } catch {}
                setTimeout(() => {
                    userRecentlyInTheList[msg.author.id] = false; // prevents from bot's spamming
                }, 5000);
                await msg.delete();
                try {
                    const messages = await msg.channel.messages.fetch({ limit: 25 });
                    const sameContent = messages.filter(m =>
                        m.author.id === msg.author.id && m.content.toLowerCase() === msg.content.toLowerCase()
                    );
                    const toDelete = sameContent.first(10);
                    for (const m of toDelete) {
                        try { await m.delete(); } catch {}
                    }
                } catch {}
                await filterLog(msg, 'antispam/co ty odsigmiasz TM');
                let expiresAt = Math.floor(Date.now() / 1000) + parseTimestamp('2d')!;
                const result = await warn(msg.member!, {
                    reason: 'nie spam',
                    mod: client.user!.id,
                    points: 1,
                    expiresAt
                });
                scheduleWarnDeletion(result.id, expiresAt);
                return MagicSkipAllActions;
            }

            // antiflood
            if (client.user!.id !== msg.author.id && isFlood(msg.content)) {
                await (msg.channel as SendableChannel).send(`🚨 <@${msg.author.id}> za dużo floodu pozdrawiam`);
                await filterLog(msg, 'antiflood/za dużo floodu TM');
                let expiresAt = Math.floor(Date.now() / 1000) + parseTimestamp('2d')!;
                const result = await warn(msg.member!, {
                    reason: 'nie flooduj',
                    mod: client.user!.id,
                    points: 1,
                    expiresAt
                });
                scheduleWarnDeletion(result.id, expiresAt);
                await msg.delete();
                return MagicSkipAllActions;
            }
        }
    ]
};