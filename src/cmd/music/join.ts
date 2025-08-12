import { Command } from '../../bot/command.js';
import { cfg } from '../../bot/cfg.js';
import { db, sqlite } from '../../bot/db.js';

import * as log from '../../util/log.js';
import * as cfgManager from '../../bot/cfgManager.js';
import * as automod from '../../bot/automod.js';

import * as dsc from 'discord.js';
import { PredefinedColors } from '../../util/color.js';
import { likeInASentence } from '../../util/lias.js';
import { joinVoiceChannel } from '@discordjs/voice';
import { sendmsg, playNext, changeConnection, isPlaying } from '../../bot/radio.js';
import { client } from '../../client.js';

export const joinCmd: Command = {
    name: 'join',
    desc: 'Wbija na kanał radia.',
    category: 'muzyka',
    expectedArgs: [],
    aliases: ['wbij'],
    allowedRoles: null,
    allowedUsers: [],

    async execute(msg, args, commands) {
        const channel = client.channels.cache.get(cfg.radio.radio_channel);

        if (!channel || !channel.isVoiceBased?.()) {
            sendmsg(`## 🫩 Kanał głosowy nie istnieje lub jest nieprawidłowy.`, cfg.radio.radio_channel);
            return;
        }

        try {
            changeConnection(joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator
            }));

            sendmsg(`## ▶️ Dołączono.\n-# ${cfg.radio.piekarnia_ad}`, cfg.radio.radio_channel);
            if (!isPlaying) playNext();
        } catch (err) {
            console.error(err);
            sendmsg(`## 🫩 Wystąpił błąd przy dołączaniu.\n-# ${cfg.radio.piekarnia_ad}`, cfg.radio.radio_channel);
        }
    },
};