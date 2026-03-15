import { Command, CommandAPI } from "@/bot/command.ts";
import { output } from "@/bot/logging.ts";
import { CommandFlags } from "../../bot/apis/commands/misc.ts";

export const depositCmd: Command = {
    name: "deposit",
    aliases: ["dep"],
    description: {
        main: "Wpłać pieniądze z portfela do banku.",
        short: "Wpłać do banku.",
    },
    flags: CommandFlags.Economy,
    permissions: {
        allowedRoles: null,
        allowedUsers: [],
    },
    expectedArgs: [
        {
            type: { base: "money", source: "wallet" },
            optional: false,
            name: "amount",
            description: 'Kwota do wpłaty (liczba, "all" lub %).',
        },
    ],
    async execute(api: CommandAPI) {
        const amount = api.getTypedArg("amount", "money").value;
        if (amount.isZero() || amount.isNegative()) {
            return api.log.replyError(api, "Namieszałeś z kwotą.", "Podaj poprawną kwotę!");
        }

        const user = api.executor;

        try {
            const balanceBefore = await user.economy.getBalance();
            if (balanceBefore.wallet.lessThan(amount)) {
                return api.log.replyError(api, "Nie masz wystarczającej ilości pieniędzy.", "Może nie zdążyłeś ich wypłacić?");
            }

            await user.economy.depositToBank(amount);
            const balanceAfter = await user.economy.getBalance();

            return api.log.replySuccess(
                api,
                "Udało się!",
                [
                    `Wpłacono **${amount.format()}** do banku.`,
                    `Nowy stan konta:`,
                    `- **${balanceAfter.bank.format()}** w banku`,
                    `- **${balanceAfter.wallet.format()}** w portfelu.`,
                ].join("\n"),
            );
        } catch (err) {
            output.err(err);
            api.log.replyError(api, "Błąd depozytu", "Coś poszło nie tak z bazą danych.");
        }
    },
};
