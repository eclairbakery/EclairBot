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
import { sendmsg, playNext, changeConnection, isPlaying, queue, connection, player } from '../../bot/radio.js';
import { client } from '../../client.js';
import ytdl from '@distube/ytdl-core';

export const queueCmd: Command = {
    name: 'queue',
    desc: 'Pokazuje kolejkę.',
    category: 'muzyka',
    expectedArgs: [],
    aliases: ['kolejka'],
    allowedRoles: null,
    allowedUsers: [],

    async execute(msg, args, commands) {
        if (queue.length === 0) {
            sendmsg(`## 📭 Kolejka jest pusta.\n-# ${cfg.radio.piekarnia_ad}`, cfg.radio.radio_channel);
            return;
        }
        const list = queue.slice(0, 10)
            .map((link, idx) => `${idx + 1}. <${link}>`)
            .join('\n');
        const more = queue.length > 10 ? `\n... i jeszcze ${queue.length - 10} więcej.` : '';
        sendmsg(`## 🎵 Kolejka utworów:\n${list}${more}\n-# ${cfg.radio.piekarnia_ad}`, cfg.radio.radio_channel);
    },
};