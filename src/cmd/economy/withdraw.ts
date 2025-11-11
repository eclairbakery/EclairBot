import { getBalance, updateBalance } from "@/bot/apis/economy/apis.js";
import { cfg } from "@/bot/cfg.js";
import { Command, CommandFlags, CommandAPI } from "@/bot/command.js";
import { output } from "@/bot/logging.js";
import * as log from '@/util/log.js';

export const withdrawCmd: Command = {
    name: 'withdraw',
    aliases: ['with', 'wd'],
    description: {
        main: 'Wypłać pieniądze z banku do portfela.',
        short: 'Wypłać z banku.',
    },
    flags: CommandFlags.Economy,
    permissions: {
        discordPerms: null,
        allowedRoles: null,
        allowedUsers: [],
    },
    expectedArgs: [
        {
            type: 'string',
            optional: false,
            name: 'amount',
            description: 'Kwota do wypłaty (liczba lub "all").',
        }
    ],
    async execute(api: CommandAPI) {
        const user = api.msg.member!.plainMember;
        try {
            const row = await getBalance(user.id);
            let amountArg = api.getTypedArg('amount', 'string')?.value as string;
            let amount = amountArg.toLowerCase() === "all" ? row.bank_money : parseInt(amountArg);

            if (isNaN(amount) || amount <= 0) {
                return api.log.replyError(api.msg, cfg.customization.economyTexts.betWrongAmountHeader, cfg.customization.economyTexts.betWrongAmountText);
            }
            if (row.bank_money < amount) {
                return api.log.replyError(api.msg, cfg.customization.economyTexts.balanceNotSufficientHeader, cfg.customization.economyTexts.bankBalanceNotSufficientText);
            }

            row.bank_money -= amount;
            row.money += amount;
            await updateBalance(user.id, row.money, row.bank_money);

            return api.log.replySuccess(api, 'Udało się!', `Wypłacono ${amount}$ z banku.\nNowy stan:\n- ${row.bank_money}$ w banku\n- ${row.money}$ w portfelu.`);
        } catch (err) {
            output.err(err);
            api.log.replyError(api.msg, 'Błąd wypłaty', 'Coś poszło nie tak z bazą danych.');
        }
    }
};
