import { Command } from '../../bot/command.js';
import { cfg } from '../../bot/cfg.js';
import { db, sqlite } from '../../bot/db.js';

import * as log from '../../util/log.js';
import * as cfgManager from '../../bot/cfgManager.js';

import * as dsc from 'discord.js';
import { PredefinedColors } from '../../util/color.js';
import capitalizeFirst from '../../util/capitalizeFirst.js';

export const changelogCmd: Command = {
    name: 'changelog',
    longDesc: 'Ogólnie mówiąc bardzo długi changelog, gdzie tłumaczę w sposób niezrozumiały dla Ciebie, co się u mnie zmieniło ostatnio.',
    shortDesc: 'Wyświetl changelog.',
    expectedArgs: [],
    aliases: [],
    allowedRoles: null,
    allowedUsers: [],

    execute(msg, args, commands) {
        msg.reply({
            embeds: [
                new dsc.EmbedBuilder()
                    .setAuthor( { name: 'EclairBOT' } )
                    .setColor(PredefinedColors.Pink)
                    .setTitle('EclairBOT beta 1.0')
                    .setDescription('Krótko mówiąc dodane zostały te komendy: `bal`, `blackjack`, `crime`, `rob`, `slut`, `work`, `topeco`, `banner`, `changelog`, `commands`, `help`, `detail-help`, `man`, `pfp`, `siema`, `animal`, `dog`, `cat`, `parrot`, `lvl`, `toplvl`, `xp`, `ban`, `kick`, `mute`, `unmute`, `warn`, `warn-clear`, `warnlist`. Pewnie pojawi się jeszcze więcej.')
            ]
        });
    },
};