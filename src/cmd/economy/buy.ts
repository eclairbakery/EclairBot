import * as dsc from "discord.js";
import { cfg } from "@/bot/cfg.js";
import { Command, CommandFlags } from "@/bot/command.js";
import { dbGet, dbRun } from "@/util/dbUtils.js";
import { PredefinedColors } from "@/util/color.js";
import { output } from "@/bot/logging.js";

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
            const row = await dbGet("SELECT money FROM economy WHERE user_id = ?", [userId]);
            const money = row && typeof row.money === "number" ? Number(row.money) : 0;

            if (money < item.price) {
                return api.log.replyError(
                    api,
                    "Nie stać Cię!",
                    `Nie stać Cię na **${item.name}**. Brakuje Ci **${item.price - money}** dolarów.`
                );
            }

            await dbRun("BEGIN TRANSACTION");

            await dbRun("UPDATE economy SET money = money - ? WHERE user_id = ?", [item.price, userId]);

            if (item.role) {
                const role = msg.guild?.roles.cache.get(item.role);
                const member = msg.guild?.members.cache.get(userId);

                if (role && member) {
                    await member.roles.add(role).catch(() => {});
                }
            }

            await dbRun("COMMIT");

            const embed = new dsc.EmbedBuilder()
                .setColor(PredefinedColors.Green)
                .setTitle("Zakup udany!")
                .setDescription(`Kupiłeś **${item.name}** za **${item.price}** dolarów.\n${item.description}`);

            return msg.reply({ embeds: [embed] });
        } catch (err) {
            output.err(err);
            try { await dbRun("ROLLBACK"); } catch {}

            return api.log.replyError(
                api,
                "Coś poszło bardzo nie tak...",
                "Spróbuj ponownie później."
            );
        }
    }
};