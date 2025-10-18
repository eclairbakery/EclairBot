import { cfg, overrideCfg, Config, saveConfigurationChanges } from "@/bot/cfg.js";
import { Command, CommandFlags } from "@/bot/command.js";

export const configurationCommand: Command = {
    name: 'configuration',
    description: {
        main: 'Zmień konfigurację bota, bo exec robi to źle!',
        short: 'Zmienia config bota.'
    },
    aliases: ['cfg', 'setcfg'],
    expectedArgs: [
        {
            name: 'arg',
            description: 'Argument generalnie który chcesz zmodyfikować w konfiguracji, np. `masterSecurity.fuckNewMembers`.',
            type: 'string',
            optional: false
        },
        {
            name: 'value',
            description: 'Wartość. Ostrzeżenie: Pod spodem uruchamia eval, więc jest unsafe. Możesz skipnąć i wtedy masz wartość ;)',
            type: 'trailing-string',
            optional: true
        }
    ],
    flags: CommandFlags.Important,
    permissions: {
        discordPerms: [],
        allowedRoles: cfg.devPerms.allowedRoles,
        allowedUsers: cfg.devPerms.allowedUsers,
    },

    async execute(api) {
        const property = api.getTypedArg('arg', 'string')?.value as string;
        const value = api.getTypedArg('value', 'trailing-string')?.value as string | undefined;

        const keys = property.split(".");
        let target: any = cfg;
        let targetOverride: any = overrideCfg;

        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in target)) {
                return api.msg.reply(`❌ klucz "${key}" nie istnieje w konfiguracji (nie, nie możesz robić nowych).`);
            }
            target = target[key];

            if (!(key in targetOverride)) {
                targetOverride[key] = {};
            }
            targetOverride = targetOverride[key];
        }

        const lastKey = keys[keys.length - 1];

        if (!(lastKey in target)) {
            return api.msg.reply(`❌ klucz "${lastKey}" nie istnieje w konfiguracji (nie, nie możesz robić nowych).`);
        }

        if (!value) {
            const currentValue = target[lastKey];
            return api.msg.reply(
                `🔍 wartość \`${property}\` = \`\`\`${JSON.stringify(currentValue, null, 4)}\`\`\``
            );
        }

        let sanitizedValue = value.trim();
        if (sanitizedValue.startsWith("```") && sanitizedValue.endsWith("```")) {
            sanitizedValue = sanitizedValue.slice(3, -3).trim();
        }

        let evaluatedValue: any;
        try {
            evaluatedValue = (0, eval)(sanitizedValue);
        } catch (e) {
            return api.msg.reply(`❌ nie udało się sparsować wartości: ${e}`);
        }

        target[lastKey] = evaluatedValue;
        targetOverride[lastKey] = evaluatedValue;

        try {
            saveConfigurationChanges();
        } catch (e) {
            return api.msg.reply(`⚠️ ustawiono \`${property}\`, ale nie udało się zapisać zmian w stałej konfiguracji`);
        }

        return api.msg.reply(
            `✅ ustawiono \`${property}\` na \`${sanitizedValue}\`; polecam jeszcze odpalić \`${cfg.general.prefix}restart\`.`
        );
    },
};