import { CommandFlags } from '../../bot/apis/commands/misc.ts';
import { CommandPermissions } from '../../bot/apis/commands/permissions.ts';
import { cfg } from '../../bot/cfg.ts';
import { Command } from '../../bot/command.ts';
import { executeAsk } from '../../features/ei/ask.ts';

const askCmd: Command = {
    name: 'ask',
    aliases: ['zapytaj'],
    description: {
        main: "Poproś EclairBOT'a o to, by zrobił to co chcesz lub po prostu pogadaj z tym samotnym botem",
        short: 'Zapytaj EclairBOTa',
    },

    permissions: CommandPermissions.everyone(),
    flags: CommandFlags.None,

    expectedArgs: [
        {
            name: 'question',
            description: 'O co chcesz spytać się EclairBOTa',
            optional: false,
            type: { base: 'string', trailing: true, allowCodeBlock: true },
        },
    ],

    execute(api) {
        const ctxMsgs = api.getTypedArg('context-msgs', 'int')?.value ?? cfg.features.ai.contextDefaultMessages;
        const question = api.getTypedArg('question', 'string')!.value;

        if (!api.raw.msg) {
            return api.log.replyError(api, 'Błąd', 'Nie możesz używać tej super komendy w slash commands jeszcze.');
        }

        executeAsk(api.raw.msg, question, Number(ctxMsgs));
    },
};

export default askCmd;
