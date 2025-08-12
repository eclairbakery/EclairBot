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

export const skipCmd: Command = {
    name: 'skip',
    desc: 'Pomija utwór.',
    category: 'muzyka',
    expectedArgs: [],
    aliases: ['pomin', 'pomiń'],
    allowedRoles: null,
    allowedUsers: [],

    async execute(msg, args, commands) {
        if (!player || !isPlaying) {
            sendmsg(`❌ Nic nie jest obecnie odtwarzane.\n-# ${cfg.radio.piekarnia_ad}`, cfg.radio.radio_channel);
            return;
        }
        player.stop();
        sendmsg(`## ⏭️ Pominąłem utwór.\n-# ${cfg.radio.piekarnia_ad}`, cfg.radio.radio_channel);
    },
};