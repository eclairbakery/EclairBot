import { Command } from '@/bot/command.ts';
import { CommandFlags } from '@/bot/apis/commands/misc.ts';
import { CommandPermissions } from '@/bot/apis/commands/permissions.ts';
import { playNext } from '@/features/radio/mainLoop.ts';

export const skipCmd: Command = {
    name: 'skip',
    aliases: [],
    description: {
        main: 'Pomijasz słaby utwór, który tragiczny jest.',
        short: 'Utwór pomijasz.'
    },

    flags: CommandFlags.None,
    permissions: CommandPermissions.everyone(),

    expectedArgs: [],

    execute(api) {
        playNext(); 
        return api.log.replySuccess(api, 'Proszę!', 'Pominąłem utwór i teraz następny będzie grać.');
    },
};
