import { Command } from '@/bot/command.ts';
import { CommandFlags } from '@/bot/apis/commands/misc.ts';
import { CommandPermissions } from '@/bot/apis/commands/permissions.ts';
import { queue } from '@/features/radio/mainLoop.ts';

const yt_regex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=[\w-]{11}(&si=[\w-]+)?)|(youtu\.be\/[\w-]{11}(\?si=[\w-]+)?)$/;

export const playCmd: Command = {
    name: 'play',
    aliases: [],
    description: {
        main: 'Dodajesz do kolejki swój zaawansowany utwór.',
        short: 'Do kolejki dodajesz.'
    },

    flags: CommandFlags.None,
    permissions: CommandPermissions.everyone(),

    expectedArgs: [
        {
            name: 'url', description: "URL do Twej piosnki",
            optional: false, type: { base: "string" }
        }
    ],

    execute(api) {
        const url = api.getTypedArg('url', 'string').value;

        if (!yt_regex.test(url)) {
            return api.log.replyError(api, "Zły ten link, ziom", "To miał być link do YouTube, nie do kij wie czego.")
        }

        queue.push(url);

        return api.log.replySuccess(api, 'Proszę!', `Dodałem twój amazing utwór ${url} do kolejki!`);
    },
};
