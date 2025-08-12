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
import { sendmsg, playNext, changeConnection, isPlaying, queue, connection } from '../../bot/radio.js';
import { client } from '../../client.js';
import ytdl from '@distube/ytdl-core';

export const playCmd: Command = {
    name: 'play',
    desc: 'Puszcza utwór',
    category: 'muzyka',
    expectedArgs: [],
    aliases: ['pusc'],
    allowedRoles: null,
    allowedUsers: [],

    async execute(msg, args, commands) {
        const url = args[1];

        if (!connection) {
            sendmsg(`## 📡 Najpierw użyj \`=join\`.\n-# ${cfg.radio.piekarnia_ad}`, cfg.radio.radio_channel);
            return;
        }

        if (url && !ytdl.validateURL(url)) {
            msg.reply(`## 🫩 Podaj prawidłowy link do YouTube.\n-# ${cfg.radio.piekarnia_ad}`);
            return;
        }

        if (url) queue.push(url);
        else queue.push(cfg.radio.default_playlist[Math.floor(Math.random() * cfg.radio.default_playlist.length)]);

        sendmsg(`## 📥 Dodano do kolejki.\n-# ${cfg.radio.piekarnia_ad}`, cfg.radio.radio_channel);

        if (!isPlaying) playNext();
    },
};