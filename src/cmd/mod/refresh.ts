import User from "@/bot/apis/db/user.js";
import { Command, CommandAPI, CommandFlags } from "@/bot/command.js";
import { addLvlRole, xpToLevel } from "@/bot/level.js";
import actionsManager, { OnForceReloadTemplates } from "@/events/actions/templatesEvents.js";

export const refreshCmd: Command = {
    name: 'refresh',
    aliases: [],
    description: {
        main: 'Jeśli uważasz że template channels się nie przeładowały i pokazują błędne dane to... mylisz się! eclair bot jest idealny. A tak serio to tą komendą możesz wymusić reload',
        short: 'Wymusza przeładowanie wszystkich template channels',
    },
    flags: CommandFlags.Important,

    expectedArgs: [
        {
            name: "flags",
            type: "trailing-string",
            description: "Użyj różnych flag, by zmienić działanie tej komendy. Użyj \'--help\' by się czegoś dowiedzieć na ich temat.",
            optional: true
        }
    ],
    permissions: {
        discordPerms: null,
        allowedRoles: null,
        allowedUsers: null,
    },

    async execute(api: CommandAPI) {
        // define constants & variables
        let flags = (api.getTypedArg('flags', 'trailing-string')?.value ?? '').split(' ');
        let reloadedThings: string[] = [];
        let failedThingsToReload: string[] = [];
        const user = api.executor;

        // help
        if (flags.includes('--help')) {
            return api.log.replyTip(api, 'Flagi komendy', 'Możesz użyć tych flag: `--no-template-channels`, `--no-lvl-roles`. Możesz je ze soba łączyć, o ile rozdzielisz je spacją. Kolejność nie ma znaczenia.');
        }

        // checks
        if (!api.guild) {
            return api.log.replyWarn(api, 'Ta komenda wymaga serwera', 'Coś się wychrzaniło i EclairBOT nie może go znaleźć.')
        }

        // base reply
        const baseReply = await api.reply('Poczekaj...');

        // template channels
        if (!flags.includes('--no-template-channels')) {
            actionsManager.emit(OnForceReloadTemplates, {});
            reloadedThings.push('- template channels (statystyki)');
        }

        // lvl roles
        if (!flags.includes('--no-lvl-roles')) {
            for (const userLvlObj of await user.leveling.getEveryoneXPNoLimit()) {
                await addLvlRole(api.guild, xpToLevel(userLvlObj.xp), userLvlObj.user_id);
            }
            reloadedThings.push('- role poziomów');
        }

        // reply
        try {
            baseReply.delete();
        } catch {}
        if (failedThingsToReload.length > 0 && reloadedThings.length > 0) {
            api.log.replySuccess(api, 'Nie udało się odświeżyć wszystkiego...', [
                'Pomyślnie przeładowano następujące rzeczy:',
                ...reloadedThings,
                '',
                'Niestety nie udało się przeładować z powodu błędów następujących rzeczy:',
                ...failedThingsToReload
            ].join('\n'));
        } else if (reloadedThings.length > 0) {
            api.log.replySuccess(api, 'Udało się!', [
                'Pomyślnie przeładowano następujące rzeczy:',
                ...reloadedThings,
            ].join('\n'));
        } else {
            api.log.replyError(api, 'Nie przeładowano', 'Ziignorowałeś wszystko za pomocą flag...')
        }
    }
};
