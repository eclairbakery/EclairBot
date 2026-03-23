import { CommandFlags } from '../../bot/apis/commands/misc.ts';
import { CommandPermissions } from '../../bot/apis/commands/permissions.ts';
import { cfg } from '../../bot/cfg.ts';
import { Command } from '../../bot/command.ts';
import { executeAsk } from '../../features/ei/ask.ts';

export const askCmd: Command = {
    name: 'ask',
    aliases: ['zapytaj'],
    description: {
        main: "Poproś EclairBOT'a o to, by zrobił to co chcesz lub po prostu pogadaj z tym samotnym botem",
        short: "Zapytaj EclairBOTa"
    },

    permissions: CommandPermissions.everyone(),
    flags: CommandFlags.None,

    expectedArgs: [
        {
            name: 'question',
            description: "O co chcesz spytać się EclairBOTa",
            optional: false,
            type: { base: 'string', trailing: true }
        }
    ],

    execute(api) {
        const question = api.getTypedArg('question', 'string');

        if (!api.raw.msg) 
            return api.log.replyError(api, 'Błąd', 'Nie możesz używać tej super komendy w slash commands jeszcze.')

        executeAsk(api.raw.msg, question.value, cfg.features.ai.contextDefaultMessages)
    },
};
