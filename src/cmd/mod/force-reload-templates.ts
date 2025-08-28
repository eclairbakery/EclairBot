import { Command } from '../../bot/command.js';
import { db } from '../../bot/db.js';

import * as log from '../../util/log.js';
import * as dsc from 'discord.js';
import { PredefinedColors } from '../../util/color.js';
import { cfg } from '../../bot/cfg.js';

import actionsManager, { OnForceReloadTemplates, ForceReloadTemplatesEventCtx } from '../../events/templatesEvents.js';

export const forceReloadTemplatesCmd: Command = {
    name: 'force-reload-templates',
    longDesc: 'Jeśli uważasz że template channels się nie przeładowały i pokazują błędne dane to... mylisz się! eclair bot jest idealny. A tak serio to tą komendą możesz wymusić reload',
    shortDesc: 'Wymusza przeładowanie wszystkich template channels',
    expectedArgs: [],

    aliases: [],
    allowedRoles: null,
    allowedUsers: null,

    async execute(msg, args) {
        void args;

        actionsManager.emit(OnForceReloadTemplates, {});
        msg.reply({
            embeds: [
                {
                    title: 'Przeladowano wszystkie template channels!',
                    description: 'Teraz wszystko powinno być aktualne! a jeśli nie jest to już nie mój problem :joe_noniewiemno:',
                    color: PredefinedColors.Aqua,
                }
            ],
        });
    }
};