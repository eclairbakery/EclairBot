import { getBalance, updateBalance } from "@/bot/apis/economy/apis.js";
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
        const user = api.msg.member!.plainMember;
        try {
            const row = await getBalance(user.id);
            let amount = api.getTypedArg('amount', 'number')?.value as number;

            if (isNaN(amount) || amount <= 0) {
                return api.log.replyError(api.msg, cfg.customization.economyTexts.betWrongAmountHeader, cfg.customization.economyTexts.betWrongAmountText);
            }
            if (row.money < amount) {
                return api.log.replyError(api.msg, cfg.customization.economyTexts.balanceNotSufficientHeader, cfg.customization.economyTexts.balanceNotSufficientText);
            }

            row.money -= amount;
            row.bank_money += amount;
            await updateBalance(user.id, row.money, row.bank_money);

            return api.log.replySuccess(api, 'Udało się!', `Wpłacono ${amount}$ do banku.\nNowy stan:\n- ${row.bank_money}$ w banku\n- ${row.money}$ w portfelu.`);
        } catch (err) {
            output.err(err);
            api.log.replyError(api.msg, 'Błąd depozytu', 'Coś poszło nie tak z bazą danych.');
        }
    }
};