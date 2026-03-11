import { cfg, overrideCfg, saveConfigurationChanges } from '@/bot/cfg.js';
import { Command, CommandFlags } from '@/bot/command.js';

export const echoCmd: Command = {
    name: 'echo',
    description: {
        main: 'Wypisuje podany argument',
        short: 'Wypisuje podany argument',
    },
    aliases: ['debug-print'],
    expectedArgs: [
        {
            name: 'arg',
            description: 'no argument',
            type: {
                base: 'union',
                variants: [
                    { base: 'int' }, { base: 'float' }, { base: 'timestamp' },
                    { base: 'user-mention', includeRefMessageAuthor: true },
                    { base: 'role-mention' }, { base: 'string', trailing: true },
                ],
            },
            optional: false,
        },
    ],
    flags: CommandFlags.Important,
    permissions: {
        allowedRoles: cfg.legacy.devPerms.allowedRoles,
        allowedUsers: cfg.legacy.devPerms.allowedUsers,
    },
    
    async execute(api) {
        const arg = api.getTypedArg('arg', ['int', 'float', 'timestamp', 'user-mention', 'role-mention', 'string']);
        switch (arg.type.base) {
        case 'int':
            api.reply(`int: ${arg.value}`);
            break;
        case 'float':
            api.reply(`float: ${arg.value}`);
            break;

        case 'string':
            api.reply(`string: \`${arg.value}\``);
            break;

        case 'timestamp':
            api.reply(`timestamp: ${arg.value} seconds`);
            break;

        case 'user-mention':
            api.reply(`user-mention: ${arg.value}`);
            break;
        case 'role-mention':
            api.reply(`role-mention: ${arg.value}`);
            break;
        }
    }
};
