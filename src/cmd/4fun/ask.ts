import { Command } from '@/bot/command.ts';
import { CommandFlags } from '@/bot/apis/commands/misc.ts';

import * as gemini from '@/bot/apis/gemini/model.ts';

import * as dsc from 'discord.js';

export const askCmd: Command = {
    name: 'ask',
    aliases: ['question', 'ei-ask'],
    description: {
        main: 'Zapytaj EI (Eclair Inteligence) o wszysko co tylko chcesz!',
        short: 'Zapytaj o coś EI',
    },
    flags: CommandFlags.None,

    expectedArgs: [
        {
            name: 'question',
            description: 'No twoje pytanie',
            type: { base: 'string', trailing: true },
            optional: false,
        }
    ],

    permissions: {
        allowedRoles: null,
        allowedUsers: null,
    },

    async execute(api) {
        const question = api.getTypedArg('question', 'string').value!;
        const answer = await gemini.askModel('ask-cmd', question);

        if (!gemini.isInitialized()) {
            return api.log.replyError(
                api, 'Błąd',
                'Moduł integracji z gemini nie został załadowany przez eclairbota.'
                  + 'A tak po ludzku to poprostu ktoś nie dał api key do .env',
            );
        }

        let msg: dsc.Message | null = null;
        let content: string = '';

        for await (const part of answer.stream) {
            content += part.text();
            if (!msg) {
                msg = await api.reply(content);
            } else {
                await msg.edit(content);
            }
        }
    }
};
