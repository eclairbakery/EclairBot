import { cfg } from '@/bot/cfg.js';
import { Command, CommandFlags } from '@/bot/command.js';
import * as dsc from 'discord.js';
import { canEval } from './eval.js';
import { output } from '@/bot/logging.js';

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
        allowedRoles: cfg.devPerms.allowedRoles,
        allowedUsers: cfg.devPerms.allowedUsers,
    },

    async execute(api) {
        if (!canEval) {
            return api.reply(cfg.customization.evalWarnings.waitRestart);
        }
        output.log('Issued restart. This will work due to the behaviour of Pterodactyl Daemon.');
        await api.reply(cfg.customization.evalWarnings.gonnaRestart);
        process.exit(1);
    },
};
