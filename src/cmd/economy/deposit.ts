import User from "@/bot/apis/db/user.js";
import { formatMoney } from '@/util/math/format.js';
import { cfg } from "@/bot/cfg.js";
import { Command, CommandFlags, CommandAPI } from "@/bot/command.js";
import { output } from "@/bot/logging.js";
import * as log from '@/util/log.js';

export const depositCmd: Command = {
    name: 'deposit',
    aliases: ['dep'],
    description: {
        main: 'Wpłać pieniądze z portfela do banku.',
        short: 'Wpłać do banku.',
    },
    flags: CommandFlags.Economy,
    permissions: {
        discordPerms: null,
        allowedRoles: null,
        allowedUsers: [],
    },
    expectedArgs: [
        {
            type: 'number',
            optional: false,
            name: 'amount',
            description: 'Kwota do wpłaty (liczba lub "all").',
        }
    ],
    async execute(api: CommandAPI) {
        const amount = api.getTypedArg('amount', 'number')?.value as number;
        if (isNaN(amount) || amount <= 0) {
            return api.log.replyError(api.msg, cfg.customization.economyTexts.betWrongAmountHeader, cfg.customization.economyTexts.betWrongAmountText);
        }

        const user = api.executor;
        const userBalance = await user.economy.getBalance();

        try {
            if (userBalance.wallet < amount) {
                return api.log.replyError(api.msg, cfg.customization.economyTexts.balanceNotSufficientHeader, cfg.customization.economyTexts.balanceNotSufficientText);
            }

            await user.economy.depositToBank(amount);
            return api.log.replySuccess(
                api,
                'Udało się!',
                [
                    `Wpłacono ${amount}$ do banku.`,
                    `Nowy stan konta:`,
                    `- ${formatMoney(userBalance.bank)} w banku`,
                    `- ${formatMoney(userBalance.wallet)}$ w portfelu.`,
                ].join('\n')
            );
        } catch (err) {
            output.err(err);
            api.log.replyError(api.msg, 'Błąd depozytu', 'Coś poszło nie tak z bazą danych.');
        }
    }
};
