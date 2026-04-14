import { cfg, overrideCfg, saveConfigurationChanges } from '@/bot/cfg.ts';
import { Command } from '@/bot/command.ts';
import { CommandFlags } from '@/bot/apis/commands/misc.ts';

const configurationCommand: Command = {
    name: 'configuration',
    description: {
        main: 'Zmień konfigurację bota, bo exec robi to źle!',
        short: 'Zmienia config bota.',
    },
    aliases: ['cfg', 'setcfg'],
    expectedArgs: [
        {
            name: 'arg',
            description: 'Argument generalnie który chcesz zmodyfikować w konfiguracji, np. `masterSecurity.fuckNewMembers`.',
            type: { base: 'string' },
            optional: false,
        },
        {
            name: 'value',
            description: 'Wartość. Ostrzeżenie: Pod spodem uruchamia eval, więc jest unsafe. Możesz skipnąć i wtedy masz wartość ;)',
            type: { base: 'code', trailing: true },
            optional: true,
        },
    ],
    flags: CommandFlags.Important | CommandFlags.Unsafe,
    permissions: {
        allowedRoles: cfg.hierarchy.developers.allowedRoles,
        allowedUsers: cfg.hierarchy.developers.allowedUsers,
    },

    async execute(api) {
        const property = api.getTypedArg('arg', 'string')?.value;
        const value = api.getTypedArg('value', 'code')?.value?.src;

        const keys = property.split('.');
        let target: { [k: string]: unknown } = cfg as unknown as { [k: string]: unknown };
        let targetOverride: Partial<{ [k: string]: unknown }> = overrideCfg as Partial<{ [k: string]: unknown }>;

        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in target)) {
                return api.log.replyError(api, 'Zły ten key', `Klucz "${key}" nie istnieje w konfiguracji (nie, nie możesz robić nowych).`);
            }
            target = target[key] as { [k: string]: unknown };

            if (!(key in targetOverride)) {
                targetOverride[key] = {};
            }
            targetOverride = targetOverride[key] as { [k: string]: unknown };
        }

        const lastKey = keys[keys.length - 1];

        if (!(lastKey in target)) {
            return api.log.replyError(api, 'Zły ten klucz', `Klucz "${lastKey}" nie istnieje w konfiguracji (nie, nie możesz robić nowych).`);
        }

        if (!value) {
            const currentValue = target[lastKey];
            const text = `Wartość \`${property}\` = \`\`\`${JSON.stringify(currentValue, null, 4)}\`\`\``;
            if (text.length > 1900) {
                if (typeof currentValue === 'object') {
                    return api.log.replyWarn(api, "Coś długi ten objekt", `\`${property}\` jest trochę za długie by je tu wyświetlić, ale jest obiektem, więc mogę Ci podać klucze, pod którymi może znajdziesz swoją wymarzoną wartość: \`[${Object.keys(currentValue as object).join(', ')}]\``);
                }
                return api.log.replyError(api, "Coś długi ten property", `\`${property}\` jest trochę za długie by je tu wyświetlić i nie jest obiektem, więc niestety nic nie mogę zrobić, by ci pomóc`);
            } else {
                return api.log.replySuccess(api, 'Proszę bardzo', text);
            }
        }

        let evaluatedValue: unknown;
        try {
            evaluatedValue = (0, eval)('(' + value + ')');
        } catch (e) {
            return api.log.replyError(api, 'Masz problem', `Nie udało się sparsować wartości: ${e}`);
        }

        target[lastKey] = evaluatedValue;
        targetOverride[lastKey] = evaluatedValue;

        try {
            saveConfigurationChanges();
        } catch {
            return api.reply(`⚠️ ustawiono \`${property}\`, ale nie udało się zapisać zmian w stałej konfiguracji`);
        }

        return api.log.replySuccess(
            api, 'Yay!',
            `Ustawiono \`${property}\` na \`${value}\`; polecam jeszcze odpalić \`${cfg.commands.prefix}restart\`.`,
        );
    },
};

export default configurationCommand;
