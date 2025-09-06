import { Command } from '../../bot/command.js';
import * as dsc from 'discord.js';

let canRestart = false;

setTimeout(() => {
    canRestart = true; // fix: aborting automatic restart, last crash occurred less than 60 seconds ago
}, 61 * 1000);

export const restartCmd: Command = {
    name: 'restart',
    description: {
        main: 'Restartuje bota... Nie tykaj!',
        short: 'Szybki restart bota!',
    },
    expectedArgs: [],
    aliases: [],
    permissions: {
        discordPerms: null,
        allowedRoles: null,
        allowedUsers: [],
    },

    async execute(api) {
        if (api.msg.author.id !== '990959984005222410') {
            return api.msg.reply('nuh uh');
        }
        if (!canRestart) {
            return api.msg.reply('operacja unsafe w tym momencie');
        }

        console.log('Issued restart. This will work due to the behaviour of Pterodactyl Daemon.');
        await api.msg.reply('jusz siem restartujem plis łejt plis plis plis łejt');
        process.exit(1);
    },
};