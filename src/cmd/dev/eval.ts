import { cfg } from '@/bot/cfg.js';
import { Command } from '@/bot/command.js';
import * as dsc from 'discord.js';

export const evalCmd: Command = {
    name: 'eval',
    description: {
        main: 'Wykonuje kod JavaScript. Jest naprawdę potencjalnie unsafe, dlatego to jest locknięte do granic możliwości.',
        short: 'Wykonuje kod JavaScript, więc jest bardzo unsafe.',
    },
    expectedArgs: [
        { name: 'code', type: 'trailing-string', description: 'Kod JS do wykonania', optional: false },
    ],
    aliases: [],
    permissions: {
        discordPerms: [],
        allowedRoles: cfg.devPerms.allowedRoles,
        allowedUsers: cfg.devPerms.allowedUsers,
    },

    async execute(api) {
        const code = api.getTypedArg('code', 'trailing-string')?.value as string;
        try {
            const result = (0, eval)(code);
            return api.msg.reply(`wynik twojej super komendy:\n\`\`\`${result.replace('`', '\`')}\`\`\``);
        } catch (err) {
            return api.msg.reply(`❌ Błąd podczas evala:\n\`\`\`${err}\`\`\``);
        }
    },
};