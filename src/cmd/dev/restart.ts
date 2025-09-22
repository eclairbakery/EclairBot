import { cfg } from '@/bot/cfg.js';
import { Command, CommandFlags } from '@/bot/command.js';
import * as dsc from 'discord.js';
import { canEval } from './eval.js';

export const restartCmd: Command = {
    name: 'restart',
    description: {
        main: 'Restartuje bota... Nie tykaj!',
        short: 'Szybki restart bota!',
    },
    flags: CommandFlags.Important,
    expectedArgs: [],
    aliases: [],
    permissions: {
        discordPerms: [],
        allowedRoles: cfg.devPerms.allowedRoles,
        allowedUsers: cfg.devPerms.allowedUsers,
    },

    async execute(api) {
        if (!canEval) {
            return api.msg.reply('cierpliwości');
        }
        console.log('Issued restart. This will work due to the behaviour of Pterodactyl Daemon.');
        await api.msg.reply('jusz siem restartujem plis łejt plis plis plis łejt');
        process.exit(1);
    },
};
