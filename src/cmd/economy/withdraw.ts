import { getBalance, updateBalance } from "@/bot/apis/economy/apis.js";
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
                return api.msg.reply('❌ Podaj poprawną kwotę.');
            }
            if (row.bank_money < amount) {
                return api.msg.reply('❌ Nie masz tyle pieniędzy w banku.');
            }

            row.bank_money -= amount;
            row.money += amount;
            await updateBalance(user.id, row.money, row.bank_money);

            await api.msg.reply(`✅ Wypłacono ${amount}$ z banku.\nNowy stan: 💳 ${row.bank_money}$ w banku, 💷 ${row.money}$ w portfelu.`);
        } catch (err) {
            output.err(err);
            log.replyError(api.msg, 'Błąd wypłaty', 'Coś poszło nie tak z bazą danych.');
        }
    }
};
