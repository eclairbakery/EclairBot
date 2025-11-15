import { Category, Command } from '@/bot/command.js';

import { detailHelpCmd } from '@/cmd/general/detailHelp.js';
import { quickHelpCmd } from '@/cmd/general/help.js';
import { commandsCmd } from '@/cmd/general/commands.js';
import { manCmd } from '@/cmd/general/man.js';
import { siemaCmd } from '@/cmd/general/siema.js';
import { randsiteCmd } from '@/cmd/general/randsite.js';
import { pfpCmd } from '@/cmd/general/pfp.js';
import { fandomCmd } from '@/cmd/general/fandom.js';
import { bannerCmd } from '@/cmd/general/banner.js';

import { warnCmd } from '@/cmd/mod/warn.js';
import { kickCmd } from '@/cmd/mod/kick.js';
import { banCmd } from '@/cmd/mod/ban.js';
import { warnlistCmd } from '@/cmd/mod/warnlist.js';
import { izolatkaCmd } from '@/cmd/mod/izolatka.js';
import { shitwarnCmd } from '@/cmd/mod/shitwarn.js';
import { muteCmd } from '@/cmd/mod/mute.js';
import { unmuteCmd } from '@/cmd/mod/unmute.js';
import { clearCmd } from '@/cmd/mod/clear.js';
import { forceReloadTemplatesCmd } from '@/cmd/mod/force-reload-templates.js';
import { notifyCmd } from '@/cmd/mod/ping.js';
import { warnClearCmd } from '@/cmd/mod/warn-clear.js';

import { workCmd } from '@/cmd/economy/work.js';
import { slutCmd } from '@/cmd/economy/slut.js';
import { crimeCmd } from '@/cmd/economy/crime.js';
import { topecoCmd } from '@/cmd/economy/topeco.js';
import { balCmd } from '@/cmd/economy/bal.js';
import { blackjackCmd } from '@/cmd/economy/blackjack.js';
import { robCmd } from '@/cmd/economy/rob.js';
import { withdrawCmd } from './economy/withdraw.js';
import { depositCmd } from './economy/deposit.js';
import { shopCmd } from './economy/shop.js';

import { xpCmd } from '@/cmd/leveling/xp.js';
import { lvlCmd } from '@/cmd/leveling/lvl.js';
import { toplvlCmd } from '@/cmd/leveling/toplvl.js';

import { plusRepCmd } from '@/cmd/4fun/like.js';
import { subRepCmd } from '@/cmd/4fun/dislike.js';
import { reputationCmd } from '@/cmd/4fun/reputation.js';

import { animalCmd, catCmd, dogCmd, parrotCmd } from '@/cmd/gif/gifs.js';

import { wikiCmd } from '@/cmd/general/wiki.js';
import { toprepCmd } from '@/cmd/4fun/toprep.js';
import { replistCmd } from '@/cmd/4fun/replist.js';
import { figletCmd } from '@/cmd/4fun/figlet.js';

import { restartCmd } from '@/cmd/dev/restart.js';
import { evalCmd } from '@/cmd/dev/eval.js';
import { configurationCommand } from './dev/configuration.js';
import anonSaysCmd from './general/anonsays.js';
import { moneyCmd } from './economy/money.js';
import { enableCommandCmd } from './dev/enable-cmd.js';
import { disableCommandCmd } from './dev/disable-cmd.js';
import { buyCmd } from './economy/buy.js';
import { refreshCmd } from './mod/refresh.js';

export const commands: Map<Category, Command[]> = new Map([
    [
        Category.General,
        [
            detailHelpCmd, quickHelpCmd, commandsCmd,
            manCmd, 
            bannerCmd, pfpCmd,
            siemaCmd, randsiteCmd,
            wikiCmd, fandomCmd, anonSaysCmd
        ]
    ],
    [
        Category.Mod,
        [
            forceReloadTemplatesCmd, clearCmd,
            warnCmd, warnClearCmd, shitwarnCmd, warnlistCmd,
            muteCmd, unmuteCmd,
            banCmd, kickCmd, izolatkaCmd,
            notifyCmd, refreshCmd
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
            balCmd, workCmd, blackjackCmd, slutCmd, crimeCmd, topecoCmd, robCmd, withdrawCmd, depositCmd, shopCmd, moneyCmd, buyCmd
        ]
    ],
    [
        Category.DevelopersOnly,
        [
            evalCmd, restartCmd, configurationCommand,
            enableCommandCmd, disableCommandCmd
        ],
    ],
    [
        Category.ForFun,
        [
            plusRepCmd, subRepCmd, reputationCmd,
            toprepCmd, replistCmd,
            figletCmd,
        ],
    ]
]);
