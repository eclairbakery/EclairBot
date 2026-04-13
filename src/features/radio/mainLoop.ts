// in the next commit i will rewrite it or smth

import {
    joinVoiceChannel,
    VoiceConnection,
    createAudioPlayer,
    createAudioResource,
    StreamType,
    AudioPlayer,
    AudioPlayerStatus
} from 'discord.js-voice';
import { client } from '@/client.ts';
import { Readable } from 'node:stream';
import { spawn } from "node:child_process";
import { db } from '@/bot/apis/db/bot-db.ts';
import { TextChannel } from 'discord.js';
import { cfg } from '@/bot/cfg.ts';
import { output } from '@/bot/logging.ts';

let connection: VoiceConnection | null = null;
let player: AudioPlayer | null = null;
let isPlaying = false;

export const queue: string[] = [];

const fallback_songs = [
    "https://youtu.be/VeWVCr0xrag",
    "https://youtu.be/KkGVmN68ByU"
];

const RADIO_CHANNEL = cfg.channels.other.radioChannel;

export function getAudioUrl(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        if (!url || typeof url !== "string") {
            return reject(new Error("Invalid URL input"));
        }

        if (!/^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=[\w-]{11}(&si=[\w-]+)?)|(youtu\.be\/[\w-]{11}(\?si=[\w-]+)?)$/.test(url)) {
            return reject(new Error("Blocked non-YouTube URL"));
        }

        const args = [
            "--cookies",
            "cookies.txt",
            "-f",
            "bestaudio",
            "-g",
            url
        ];

        const proc = spawn("yt-dlp", args, {
            stdio: ["ignore", "pipe", "pipe"],
            shell: false
        });

        let output = "";
        let error = "";

        proc.stdout.on("data", (d) => output += d.toString());
        proc.stderr.on("data", (d) => error += d.toString());

        proc.on("close", (code) => {
            const result = output.trim();

            if (code !== 0) {
                return reject(new Error(error || "yt-dlp failed"));
            }

            if (!result.startsWith("http")) {
                return reject(new Error("Invalid stream URL from yt-dlp"));
            }

            resolve(result);
        });
    });
}

async function getStream(url: string) {
    const directUrl = await getAudioUrl(url);

    const res = await fetch(directUrl);

    if (!res.body) {
        throw new Error("No stream body received");
    }

    // deno-lint-ignore no-explicit-any
    const stream = Readable.fromWeb(res.body as any);

    return createAudioResource(stream, {
        inputType: StreamType.Arbitrary
    });
}

function extractUrl(input: string): string {
    if (!input) return "";
    if (input.includes("http")) return input;
    return `https://www.youtube.com/watch?v=${input}`;
}

function sendmsg(content: string, channelId: string) {
    const channel = client.channels.cache.get(channelId) as TextChannel;
    if (!channel?.isTextBased?.()) return;
    channel.send({ content, allowedMentions: { parse: [] } }).catch(() => {});
}

export async function playNext() {
    let raw = queue.shift() 
        ?? (await db.music.getRandomEntry())
        ?? fallback_songs[Math.floor(Math.random() * fallback_songs.length)];

    if (!raw) {
        isPlaying = false;
        return;
    }

    if (typeof raw !== 'string') { 
        sendmsg(`teraz gram ${raw.musicUrl} od <@${raw.authorId}>`, RADIO_CHANNEL); 
        raw = raw.musicUrl;
    } else {
        sendmsg(`teraz gram ${raw}`, RADIO_CHANNEL); 
    }

    const url = extractUrl(raw);

    try {
        const resource = await getStream(url);

        if (!player) {
            player = createAudioPlayer();

            player.on(AudioPlayerStatus.Idle, () => {
                isPlaying = false;
                setTimeout(playNext, 300);
            });

            player.on("error", () => {
                isPlaying = false;
                setTimeout(playNext, 1000);
            });
        }

        player.play(resource);
        connection?.subscribe(player);

        isPlaying = true;

    } catch (e) {
        output.err(e instanceof Error ? (e.stack ?? e.message) : String(e));
        isPlaying = false;
        setTimeout(playNext, 1500);
    }
}

export async function startRadio() {
    try {
        const guild = client.guilds.cache.first()!;
        const channel = (await guild.channels.fetch(RADIO_CHANNEL))!;

        connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator
        });

        if (!isPlaying) playNext();

    } catch (e) {
        output.err(e instanceof Error ? (e.stack ?? e.message) : String(e));
    }
}
