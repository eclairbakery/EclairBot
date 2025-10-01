import { cfg, Config } from "@/bot/cfg.js";
import { Command, CommandFlags } from "@/bot/command.js";

const configurationCommand: Command = {
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
            description: 'Wartość. Ostrzeżenie: Pod spodem uruchamia eval, więc jest unsafe.',
            type: 'trailing-string',
            optional: false
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
        const value = api.getTypedArg('value', 'trailing-string')?.value as string;
        let evaluatedValue: any;
        try {
            evaluatedValue = (0, eval)(value);
        } catch (e) {
            return api.msg.reply(`❌ nie udało się sparsować wartości: ${e}`);
        }

        const keys = property.split(".");
        let target: Config = cfg;

        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in target)) {
                return api.msg.reply(`❌ klucz "${key}" nie istnieje w konfiguracji (nie, nie możesz robić nowych).`);
            }
            target = target[key];
        }

        const lastKey = keys[keys.length - 1];

        if (!(lastKey in target)) {
            return api.msg.reply(`❌ klucz "${lastKey}" nie istnieje w konfiguracji (nie, nie możesz robić nowych).`);
        }

        target[lastKey] = evaluatedValue;

        return api.msg.reply(`ustawiono \`${property}\` na \`${value}\`; proszę zauważyć, że niektóre zmiany mogą wymagać restartu bota, a ta komenda jeszcze nie zmienia bot/config.js (w przyszłości będzie to robić z automatu jak coś)`);
    },
};