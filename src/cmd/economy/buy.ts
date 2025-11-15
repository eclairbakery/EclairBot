import * as dsc from "discord.js";
import { cfg } from "@/bot/cfg.js";
import { Command, CommandFlags } from "@/bot/command.js";
import { PredefinedColors } from "@/util/color.js";
import { output } from "@/bot/logging.js";
import User from "@/bot/apis/db/user.js";
import { formatMoney } from "@/bot/apis/economy/money.js";

export const buyCmd: Command = {
    name: "buy",
    aliases: ["kup"],
    description: {
        main: "Masz masę kasy i nie wiesz co z nią zrobić? Pomogę Ci! Kup coś!",
        short: "Kupuje wybrany przedmiot."
    },
    flags: CommandFlags.Economy,

    expectedArgs: [
        {
            name: "item",
            type: "trailing-string",
            optional: false,
            description: "Jakaś rzecz, którą chcesz kupić."
        }
    ],

    permissions: {
        discordPerms: [],
        allowedRoles: null,
        allowedUsers: null
    },

    async execute(api) {
        const msg = api.msg;
        const itemName = api.getTypedArg("item", "trailing-string")?.value ?? "";
        const normalized = itemName.trim().toLowerCase();

        const item = cfg.features.economy.shop.find(entry =>
            entry.name.trim().toLowerCase() === normalized
        );

        if (!item) {
            return api.log.replyError(
                api,
                "Coś takiego w ogóle istnieje?",
                `Nie udało się znaleźć przedmiotu.`
            );
        }

        try {
            const userId = msg.author.id;
            const user = new User(userId);
            const userBalance = await user.economy.getBalance();

            if (userBalance.wallet < item.price) {
                api.log.replyError(
                    api,
                    'Nie stać Cię!',
                    `Nie stać Cię na **${item.name}**. Brakuje Ci **${formatMoney(item.price - userBalance.wallet)}** dolarów.`
                );
                if (userBalance.bank + userBalance.wallet >= item.price) {
                    return api.log.replyTip(
                        api,
                        'Wskazówka',
                        'Za przedmioty możesz płacić tylko pieniędzmi z portfela, jednak w banku masz wystarczającą ilość pieniędzy by kupić ten przedmiot.\n**Spróbuj troche wypłacić!**',
                    );
                }
                return;
            }

            user.economy.deductWalletMoney(item.price);

            if (item.role) {
                const role = msg.guild?.roles.cache.get(item.role);
                const member = msg.guild?.members.cache.get(userId);

                if (role && member) {
                    await member.roles.add(role).catch(() => {});
                }
            }

            const embed = new dsc.EmbedBuilder()
                .setColor(PredefinedColors.Green)
                .setTitle("Zakup udany!")
                .setDescription(`Kupiłeś **${item.name}** za **${formatMoney(item.price)}**.\n${item.description}`);

            return msg.reply({ embeds: [embed] });
        } catch (err) {
            output.err(err);

            return api.log.replyError(
                api,
                "Coś poszło bardzo nie tak...",
                "Spróbuj ponownie później."
            );
        }
    }
};
