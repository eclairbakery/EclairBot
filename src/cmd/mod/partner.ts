import { Command } from '@/bot/command.ts';
import { CommandFlags } from '@/bot/apis/commands/misc.ts';
import { CommandPermissions } from '@/bot/apis/commands/permissions.ts';
import { cfg } from '@/bot/cfg.ts';

const partnerCmd: Command = {
    name: 'partner',
    aliases: ['manage-partner', 'toggle-partner-role'],
    description: {
        main: "Nowy partner? Partner który usunął reklamę? Tooglnij jego rolę!",
        short: "Przełącz rolę partnera."
    },

    flags: CommandFlags.None,
    permissions: CommandPermissions.fromCommandConfig({
        allowedRoles: [ cfg.hierarchy.partners.realizator, cfg.hierarchy.administration.headAdmin ],
        allowedUsers: []
    }),

    expectedArgs: [
        { 
            name: 'user', optional: false,
            type: { base: 'user-mention' },
            description: "Partner którego to dotyczy"
        }
    ],

    async execute(api) {
        const mem = api.getTypedArg('user', 'user-mention').value;
        const has_role = mem.roles.cache.has(cfg.hierarchy.partners.partner);
        const text = has_role ? 'usunięto' : 'dodano';

        if (has_role) 
            mem.roles.remove(cfg.hierarchy.partners.partner);
        else
            mem.roles.add(cfg.hierarchy.partners.partner);

        return await api.log.replySuccess(api, 'Udało się', `Pomyślnie ${text} rolę partnera dla użytkownika <@${mem.id}>`)
    },
};

export default partnerCmd;
