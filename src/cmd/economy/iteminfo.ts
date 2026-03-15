import { Command } from "@/bot/command.ts";
import { CommandFlags } from "@/bot/apis/commands/misc.ts";
import { PredefinedColors } from "@/util/color.ts";
import { ReplyEmbed } from "@/bot/apis/translations/reply-embed.ts";
import { MinimalActionsFormatter } from "@/bot/apis/economy/format.ts";
import { cfg } from "@/bot/cfg.ts";

export const itemInfoCmd: Command = {
    name: "iteminfo",
    aliases: ["info"],
    description: {
        main: "Pokazuje szczegółowe informacje o itemie, w tym wszystkie możliwe dropy",
        short: "Pokazuje info o itemie",
    },
    flags: CommandFlags.Economy,

    permissions: {
        allowedRoles: null,
        allowedUsers: null,
    },
    expectedArgs: [
        {
            name: "item",
            description: "Nazwa itemu którego informacje chcesz wyświetlić",
            type: { base: "string", trailing: true },
            optional: false,
        },
    ],

    async execute(api) {
        const itemArg = api.getTypedArg("item", "string");
        const itemName = itemArg.value as string;

        const item = api.economy.getItemByName(itemName);
        if (!item) {
            return api.log.replyError(
                api,
                "Nie znaleziono itemu",
                `Nie mam przedmiotu o nazwie *${itemName}*!`,
            );
        }

        const formatter = new MinimalActionsFormatter(api.economy, { maxRandVariants: 0 });
        const actionsLines = formatter.format(item.onUse);

        const embed = new ReplyEmbed()
            .setTitle(`📦 ${item.name}`)
            .setDescription(item.desc)
            .setColor(PredefinedColors.DarkVividPink);

        if (actionsLines.length > 0) {
            embed.addFields([{
                name: "Wartość:",
                value: actionsLines.join("\n").slice(0, 1024) || "Brak danych.",
                inline: false,
            }]);
        } else {
            embed.addFields([{
                name: "Wartość:",
                value: "Ten przedmiot jest czysto kolekcjonerski. nie ma żadnego efektu po użyciu.",
                inline: false,
            }]);
        }

        if (item.directOfferId) {
            const offer = api.economy.getOfferById(item.directOfferId);
            if (offer) {
                embed.addFields([{
                    name: "Oferta",
                    value: `Przedmiot dostępny w sklepie za zaskakujące **${offer.price}**\nSpróbuj ${cfg.commands.prefix}buy ${offer.name}`,
                    inline: false,
                }]);
            }
        }

        embed.setFooter({ text: `ID: ${item.id} | ${new Date()}` });
        await api.reply({ embeds: [embed] });
    },
};
