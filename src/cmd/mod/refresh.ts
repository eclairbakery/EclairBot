import { Command } from '@/bot/command.ts';
import { CommandFlags } from '@/bot/apis/commands/misc.ts';
import { CommandPermissions } from '@/bot/apis/commands/permissions.ts';
import { addLvlRole, xpToLevel } from '@/bot/level.ts';
import actionsManager, { OnForceReloadTemplates } from '@/events/actions/templatesEvents.ts';
import { CommandAPI } from '../../bot/apis/commands/api.ts';

export const refreshCmd: Command = {
    name: 'refresh',
    aliases: [],
    description: {
        main: 'Jeśli uważasz że coś się schrzaniło albo jesteś po restorze z wcześniejszej bazy danych, możesz to odpalić.',
        short: 'Wymusza przeładowanie wszystkiego.',
    },
    flags: CommandFlags.Important | CommandFlags.Unsafe,

    expectedArgs: [
        {
            name: 'flags',
            type: { base: 'string', trailing: true },
            description: "Użyj różnych flag, by zmienić działanie tej komendy. Użyj '--help' by się czegoś dowiedzieć na ich temat.",
            optional: true,
        },
    ],
    permissions: CommandPermissions.devOnly(),

    async execute(api: CommandAPI) {
        // define constants & variables
        const flags = (api.getTypedArg('flags', 'string')?.value ?? '').split(' ');
        const reloadedThings: string[] = [];
        const failedThingsToReload: string[] = [];
        const user = api.executor;

        // help
        if (flags.includes('--help')) {
            return api.log.replyTip(api, 'Flagi komendy', 'Możesz użyć tych flag: `--no-template-channels`, `--no-lvl-roles`. Możesz je ze soba łączyć, o ile rozdzielisz je spacją. Kolejność nie ma znaczenia.');
        }

        // checks
        if (!api.guild) {
            return api.log.replyWarn(api, 'Ta komenda wymaga serwera', 'Coś się wychrzaniło i EclairBOT nie może go znaleźć.');
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
            api.log.replySuccess(
                api,
                'Nie udało się odświeżyć wszystkiego...',
                [
                    'Pomyślnie przeładowano następujące rzeczy:',
                    ...reloadedThings,
                    '',
                    'Niestety nie udało się przeładować z powodu błędów następujących rzeczy:',
                    ...failedThingsToReload,
                ].join('\n'),
            );
        } else if (reloadedThings.length > 0) {
            api.log.replySuccess(
                api,
                'Udało się!',
                [
                    'Pomyślnie przeładowano następujące rzeczy:',
                    ...reloadedThings,
                ].join('\n'),
            );
        } else {
            api.log.replyError(api, 'Nie przeładowano', 'Ziignorowałeś wszystko za pomocą flag...');
        }
    },
};
