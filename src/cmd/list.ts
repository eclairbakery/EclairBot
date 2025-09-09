import { warnCmd } from '../cmd/mod/warn.js';
import { kickCmd } from '../cmd/mod/kick.js';
import { banCmd } from '../cmd/mod/ban.js';
import { detailHelpCmd } from '../cmd/general/detailHelp.js';
import { quickHelpCmd } from '../cmd/general/help.js';
import { commandsCmd } from '../cmd/general/commands.js';
import { manCmd } from '../cmd/general/man.js';
import { warnlistCmd } from '../cmd/mod/warnlist.js';
import { siemaCmd } from '../cmd/general/siema.js';
import { workCmd } from '../cmd/economy/work.js';
import { slutCmd } from '../cmd/economy/slut.js';
import { crimeCmd } from '../cmd/economy/crime.js';
import { xpCmd } from '../cmd/leveling/xp.js';
import { lvlCmd } from '../cmd/leveling/lvl.js';
import { toplvlCmd } from '../cmd/leveling/toplvl.js';
import { topecoCmd } from '../cmd/economy/topeco.js';
import { balCmd } from '../cmd/economy/bal.js';
import { warnClearCmd } from '../cmd/mod/warn-clear.js';
import { blackjackCmd } from '../cmd/economy/blackjack.js';
import { animalCmd, catCmd, dogCmd, parrotCmd } from '../cmd/gif/gifs.js';
import { pfpCmd } from '../cmd/general/pfp.js';
import { bannerCmd } from '../cmd/general/banner.js';
import { muteCmd } from '../cmd/mod/mute.js';
import { unmuteCmd } from '../cmd/mod/unmute.js';
import { robCmd } from '../cmd/economy/rob.js';
import { changelogCmd } from '../cmd/general/changelog.js';
import { randsiteCmd } from '../cmd/general/randsite.js';
import { shitwarnCmd } from '../cmd/mod/shitwarn.js';
import { forceReloadTemplatesCmd } from '../cmd/mod/force-reload-templates.js';
import { clearCmd } from '../cmd/mod/clear.js';
import { restartCmd } from '../cmd/dev/restart.js';
import { wikiCmd } from '../cmd/general/wiki.js';
import { fandomCmd } from '../cmd/general/fandom.js';
import { evalCmd } from '../cmd/dev/eval.js';
import { actionPing, notifyCmd } from '../cmd/mod/ping.js';
import { Category, Command } from '@/bot/command.js';
import { izolatkaCmd } from './mod/izolatka.js';

export const commands: Map<Category, Command[]> = new Map([
    [
        Category.General,
        [
            detailHelpCmd, quickHelpCmd, commandsCmd, manCmd, changelogCmd, bannerCmd, pfpCmd, siemaCmd, randsiteCmd, wikiCmd, fandomCmd
        ]
    ],
    [
        Category.Mod,
        [
            forceReloadTemplatesCmd, clearCmd, warnCmd, warnClearCmd, unmuteCmd, shitwarnCmd, banCmd, muteCmd, kickCmd, notifyCmd, izolatkaCmd
        ]
    ],
    [
        Category.Gifs,
        [
            parrotCmd, dogCmd, catCmd, animalCmd
        ]
    ],
    [
        Category.Leveling,
        [
            lvlCmd, toplvlCmd, xpCmd
        ]
    ],
    [
        Category.Economy,
        [
            balCmd, workCmd, blackjackCmd, slutCmd, crimeCmd, topecoCmd, robCmd
        ]
    ],
    [
        Category.DevelopersOnly,
        [
            evalCmd, restartCmd
        ]
    ]
]);