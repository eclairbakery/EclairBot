import { client, clientLogin } from "./bot/client.js";
import * as dotenv from 'dotenv';
import { ft, output } from "./bot/output.js";
import { eclairBotVersion } from "./bot/defaults/version.js";
import { leveling } from "./features/leveling.js";
import { db } from "./bot/db/db.js";

async function main() {
    // set up basics
    dotenv.config({
        quiet: true
    });

    // check required envs
    if (!process.env.TOKEN) {
        console.error(output.decorate('ERR', ft.RED, 'A token is required'));
        return;
    }

    // log into the bot account
    await clientLogin(process.env.TOKEN);

    // set up logging
    await output.init();

    // log basic info
    output.log(
        [
            'EclairBOT is online!',
            `version: EclairBOT ${eclairBotVersion.version} ${eclairBotVersion.codename}`,
            `branch: ${eclairBotVersion.branch}`
        ].join('\n  ')
    );

    // check optional envs
    if (!process.env.TENOR_API_KEY) {
        output.warn(`${ft.RED}You shall set an TENOR_API_KEY enviorment variable${ft.RESET}\nOtherwise any commands using Tenor API (mostly gifs) will not work.`);
    }

    // db set up
    db.init();

    // leveling set up
    leveling.registerMsgCreateEvent(client);
}

main();