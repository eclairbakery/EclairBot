import { Command } from '@/bot/command.ts';
import { CommandFlags } from '@/bot/apis/commands/misc.ts';

import * as ytdlp from '@/bot/apis/youtube/ytdlp.ts'

export const subtitlesCmd: Command = {
    name: 'subtitles',
    aliases: [],
    description: {
        main: 'descmain',
        short: 'descshort',
    },
    flags: CommandFlags.None,

    expectedArgs: [
        {
            type: { base: 'string' },
            optional: false,
            name: 'tuff',
            description: 'ok',
        }
    ],

    permissions: {
        allowedRoles: null,
        allowedUsers: null,
    },

    async execute(api) {
        const url = api.getTypedArg('tuff', 'string').value;
        return api.log.replyInfo(api, 'Subtitles', '```\n' + (await ytdlp.getSubtitlesVTT(url)).slice(0, 1000) + '```');
    }
};

export default subtitlesCmd;
