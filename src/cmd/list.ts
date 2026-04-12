import { Category, Command } from '@/bot/command.ts';

import { helpCmd } from '@/cmd/general/help.ts';
import { commandsCmd } from '@/cmd/general/commands.ts';
import { manCmd } from '@/cmd/general/man.ts';
import { pfpCmd } from '@/cmd/general/pfp.ts';
import { bannerCmd } from '@/cmd/general/banner.ts';

import { warnCmd } from '@/cmd/mod/warn.ts';
import { kickCmd } from '@/cmd/mod/kick.ts';
import { banCmd } from '@/cmd/mod/ban.ts';
import { warnlistCmd } from '@/cmd/mod/warnlist.ts';
import { muteCmd } from '@/cmd/mod/mute.ts';
import { unmuteCmd } from '@/cmd/mod/unmute.ts';
import { clearCmd } from '@/cmd/mod/clear.ts';
import { warnClearCmd } from '@/cmd/mod/warn-clear.ts';
import { cooldownBypassCmd } from '@/cmd/mod/cooldown-bypass.ts';
import { cmdBlockCmd } from '@/cmd/mod/cmd-block.ts';
import { resetCmd } from './dev/reset.ts';

import { workCmd } from '@/cmd/economy/work.ts';
import { slutCmd } from '@/cmd/economy/slut.ts';
import { crimeCmd } from '@/cmd/economy/crime.ts';
import { topecoCmd } from '@/cmd/economy/topeco.ts';
import { balCmd } from '@/cmd/economy/bal.ts';
import { blackjackCmd } from '@/cmd/economy/blackjack.ts';
import { robCmd } from '@/cmd/economy/rob.ts';
import { withdrawCmd } from './economy/withdraw.ts';
import { depositCmd } from './economy/deposit.ts';
import { shopCmd } from './economy/shop.ts';
import { useCmd } from './economy/use.ts';
import { itemInfoCmd } from './economy/iteminfo.ts';

import { xpCmd } from '@/cmd/leveling/xp.ts';
import { lvlCmd } from '@/cmd/leveling/lvl.ts';
import { toplvlCmd } from '@/cmd/leveling/toplvl.ts';

import { plusRepCmd } from '@/cmd/4fun/like.ts';
import { subRepCmd } from '@/cmd/4fun/dislike.ts';
import { reputationCmd } from '@/cmd/4fun/reputation.ts';

import { wikiCmd } from '@/cmd/general/wiki.ts';
import { toprepCmd } from '@/cmd/4fun/toprep.ts';
import { replistCmd } from '@/cmd/4fun/replist.ts';
import { figletCmd } from '@/cmd/4fun/figlet.ts';

import { restartCmd } from '@/cmd/dev/restart.ts';
import { evalCmd } from '@/cmd/dev/eval.ts';
import { configurationCommand } from './dev/configuration.ts';
import { ecomodCmd } from './economy/ecomod.ts';
import { enableCommandCmd } from './dev/enable-cmd.ts';
import { disableCommandCmd } from './dev/disable-cmd.ts';
import { echoCmd } from './dev/echo.ts';
import { sendEmailCmd } from './email/email.ts';
import { buyCmd } from './economy/buy.ts';
import { collectIncomeCmd } from './economy/collect-income.ts';
import { refreshCmd } from '@/cmd/mod/refresh.ts';
import { emailSignatureCmd } from './email/email-signature.ts';
import { emailDefaultTitleCmd } from './email/email-default-title.ts';
import { compileCmd } from './4fun/compile.ts';
import { emailBlacklistCmd } from './email/email-blacklist.ts';
import { askCmd } from './4fun/ask.ts';
import { searchCmd } from '@/cmd/general/search.ts';
import { addAltAccountCommand } from '@/cmd/general/add-alt.ts';

export const commands: Map<Category, Command[]> = new Map([
    [
        Category.General,
        [
            helpCmd,
            commandsCmd,
            manCmd,
            bannerCmd,
            pfpCmd,
            wikiCmd,
            searchCmd,
            addAltAccountCommand
        ],
    ],
    [
        Category.Email,
        [
            sendEmailCmd,
            emailSignatureCmd,
            emailDefaultTitleCmd,
            emailBlacklistCmd,
        ],
    ],
    [
        Category.Mod,
        [
            clearCmd,
            warnCmd,
            warnClearCmd,
            warnlistCmd,
            muteCmd,
            unmuteCmd,
            banCmd,
            kickCmd,
            refreshCmd,
            cooldownBypassCmd,
            cmdBlockCmd,
        ],
    ],
    [
        Category.Leveling,
        [
            lvlCmd,
            toplvlCmd,
            xpCmd,
        ],
    ],
    [
        Category.Economy,
        [
            balCmd,
            workCmd,
            blackjackCmd,
            slutCmd,
            crimeCmd,
            topecoCmd,
            robCmd,
            withdrawCmd,
            depositCmd,
            shopCmd,
            ecomodCmd,
            buyCmd,
            collectIncomeCmd,
            useCmd,
            itemInfoCmd,
        ],
    ],
    [
        Category.DevelopersOnly,
        [
            evalCmd,
            restartCmd,
            configurationCommand,
            enableCommandCmd,
            disableCommandCmd,
            resetCmd,
            echoCmd,
        ],
    ],
    [
        Category.ForFun,
        [
            plusRepCmd,
            subRepCmd,
            reputationCmd,
            toprepCmd,
            replistCmd,
            figletCmd,
            compileCmd,
            askCmd
        ],
    ],
]);
