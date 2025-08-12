import { Snowflake } from '../defs.js';
import { cfg } from './cfg.js';
import * as dsc from 'discord.js';
import {
    joinVoiceChannel,
    VoiceConnection,
    createAudioPlayer,
    createAudioResource,
    StreamType,
    AudioPlayer,
    AudioPlayerStatus
} from '@discordjs/voice';
import ytdl from '@distube/ytdl-core';
import { client } from '../client.js';

function sendmsg_internal(content: string, channelId: string) {
    const channel = client.channels.cache.get(channelId) as dsc.TextChannel;
    if (!channel?.isTextBased?.()) return;
    channel.send(content).catch(() => {});
}

export function sendmsg(content: string, channelIds: Snowflake | Snowflake[]) {
    if (typeof channelIds == 'string') {
        sendmsg_internal(content, channelIds);
    } else {
        channelIds.forEach((channelId) => {
            sendmsg_internal(content, channelId);
        });
    }
}

export let connection: VoiceConnection | null = null;
export let player: AudioPlayer | null = null;
export let isPlaying = false;
export const queue: string[] = [];

export function changeConnection(conn: VoiceConnection | null) {
    connection = conn;
}

export async function playNext() {
    const url = queue.shift() || cfg.radio.default_playlist[Math.floor(Math.random() * cfg.radio.default_playlist.length)];
    if (!url) {
        isPlaying = false;
        (`## ❌ Kolejka jest pusta, nic do odtworzenia.\n-# ${cfg.radio.piekarnia_ad}`);
        return;
    }

    try {
        const stream = ytdl(url, {
            filter: 'audioonly',
            highWaterMark: 1 << 25
        });

        const resource = createAudioResource(stream, {
            inputType: StreamType.Arbitrary
        });

        if (!player) {
            player = createAudioPlayer();

            player.on(AudioPlayerStatus.Idle, () => {
                isPlaying = false;
                playNext();
            });

            player.on('error', error => {
                console.error('Audio player error:', error);
                isPlaying = false;
                playNext();
            });
        }

        player.play(resource);
        connection?.subscribe(player);

        sendmsg(`## 💿 Odtwarzam: <${url}>\n-# ${cfg.radio.piekarnia_ad}`, cfg.radio.radio_channel);
        isPlaying = true;
    } catch (err) {
        console.error(err);
        sendmsg(`## 🫩 Nie udało się odtworzyć:\n<${url}>\n-# ${cfg.radio.piekarnia_ad}`, cfg.radio.radio_channel);
        isPlaying = false;
        playNext();
    }
}