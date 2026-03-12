import { Command, CommandFlags, CommandAPI } from "@/bot/command.js";
import { output } from "@/bot/logging.js";

export const withdrawCmd: Command = {
    name: 'withdraw',
    aliases: ['with', 'wd'],
    description: {
        main: 'Wypłać pieniądze z banku do portfela.',
        short: 'Wypłać z banku.',
    },
    flags: CommandFlags.Economy,
    permissions: {
        allowedRoles: null,
        allowedUsers: [],
    },
    expectedArgs: [
        {
            type: { base: 'money', source: 'bank' },
            optional: false,
            name: 'amount',
            description: 'Kwota do wypłaty (liczba, "all" lub %).',
        }
    ],
    async execute(api: CommandAPI) {
        const amount = api.getTypedArg('amount', 'money').value;
        if (amount.isZero() || amount.isNegative()) {
            return api.log.replyError(api, 'Namieszałeś z kwotą.', 'Podaj poprawną kwotę!');
        }

        const user = api.executor;

        try {
            const balanceBefore = await user.economy.getBalance();
            if (balanceBefore.bank.lessThan(amount)) {
                return api.log.replyError(api, 'Nie masz wystarczającej ilości pieniędzy.', 'Przynajmniej w banku...');
            }

            await user.economy.withdrawFromBank(amount);
            const balanceAfter = await user.economy.getBalance();

            return api.log.replySuccess(
                api,
                'Udało się!',
                [
                    `Wypłacono **${amount.format()}** z banku.`,
                    `Nowy stan:`,
                    `- **${balanceAfter.bank.format()}** w banku`,
                    `- **${balanceAfter.wallet.format()}** w portfelu.`,
                ].join('\n')
            );
        } catch (err) {
            output.err(err);
            api.log.replyError(api, 'Błąd wypłaty', 'Coś poszło nie tak z bazą danych.');
        }
    }
};
