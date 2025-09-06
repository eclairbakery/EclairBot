import { Command } from '../../bot/command.js';
import * as dsc from 'discord.js';

export const evalCmd: Command = {
    name: 'eval',
    description: {
        main: 'Wykonuje kod JavaScript. Jest naprawdę potencjalnie unsafe, dlatego to jest locknięte do granic możliwości.',
        short: 'Wykonuje kod JavaScript, więc jest bardzo unsafe.',
    },
    expectedArgs: [
        { name: 'code', type: 'string', description: 'Kod JS do wykonania', optional: false },
    ],
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

        const code = api.getArg('code')?.value as string;
        try {
            const result = (0, eval)(code);
            return api.msg.reply(`wynik twojej super komendy:\n\`\`\`${result}\`\`\``);
        } catch (err) {
            return api.msg.reply(`❌ Błąd podczas evala:\n\`\`\`${err}\`\`\``);
        }
    },
};