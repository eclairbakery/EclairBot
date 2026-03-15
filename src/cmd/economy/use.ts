import { Command } from "@/bot/command.ts";
import { CommandFlags } from "@/bot/apis/commands/misc.ts";
import { CommandPermissions } from "@/bot/apis/commands/permissions.ts";
import { CommandAPI } from "@/bot/apis/commands/api.ts";
import { PredefinedColors } from "@/util/color.ts";
import { ReplyEmbed } from "@/bot/apis/translations/reply-embed.ts";
import { output } from "@/bot/logging.ts";

import { ConfigEconomyAction } from "@/bot/definitions/config/economy.ts";
import Money from "@/util/money.ts";

export function formatAction(api: CommandAPI, action: ConfigEconomyAction): ReplyEmbed | null {
    const SuccessColor = PredefinedColors.Green;
    const LossColor = PredefinedColors.Red;

    const SuccessEmoji = "👍";
    const LossEmoji = "👎";

    switch (action.op) {
        case "add-item": {
            const item = api.economy.getItemById(action.itemId);
            if (!item) return null;
            return new ReplyEmbed()
                .setTitle(`${SuccessEmoji} Dodano przedmiot`)
                .setDescription(`Otrzymałeś przedmiot **${item.name}**!\n${item.desc}`)
                .setColor(SuccessColor);
        }
        case "rem-item": {
            const item = api.economy.getItemById(action.itemId);
            if (!item) return null;
            return new ReplyEmbed()
                .setTitle(`${LossEmoji} Zabrano przedmiot`)
                .setDescription(`Straciłeś przedmiot **${item.name}**!\n${item.desc}`)
                .setColor(LossColor);
        }

        case "add-role": {
            const role = api.economy.getRoleById(action.roleId);
            if (!role) return null;
            return new ReplyEmbed()
                .setTitle(`${SuccessEmoji} Dodano rolę`)
                .setDescription(`Otrzymałeś rolę <@&${role.discordRoleId}>!\n${role.desc}`)
                .setColor(SuccessColor);
        }
        case "rem-role": {
            const role = api.economy.getRoleById(action.roleId);
            if (!role) return null;
            return new ReplyEmbed()
                .setTitle(`${LossEmoji} Usunięto rolę`)
                .setDescription(`Straciłeś rolę <@&${role.discordRoleId}>!\n${role.desc}`)
                .setColor(LossColor);
        }

        case "add-money": {
            const money = Money.fromDollarsFloat(action.amount);
            return new ReplyEmbed()
                .setTitle(`${SuccessEmoji} Dodano pieniądze`)
                .setDescription(`Otrzymałeś ${money.format()}!`)
                .setColor(SuccessColor);
        }
        case "sub-money": {
            const money = Money.fromDollarsFloat(action.amount);
            return new ReplyEmbed()
                .setTitle(`${LossEmoji} Odjęto pieniądze`)
                .setDescription(`Straciłeś ${money.format()}!`)
                .setColor(LossColor);
        }
    }

    return null;
}

export const useCmd: Command = {
    name: "use",
    aliases: ["use-item"],
    description: {
        main: "Użyj przedmiotu z swojego ekwipunku",
        short: "Uzyj przedmiotu",
    },
    flags: CommandFlags.Economy,

    expectedArgs: [
        {
            name: "item-name",
            description: "Nazwa przedmiotu którego chcesz użyć",
            type: { base: "string", trailing: true },
            optional: false,
        },
    ],

    permissions: {
        allowedRoles: null,
        allowedUsers: null,
    },

    async execute(api) {
        const itemName = api.getTypedArg("item-name", "string")?.value ?? "";

        const item = api.economy.getItemByName(itemName);
        if (!item) {
            return api.log.replyError(
                api,
                "Nie znaleziono przedmiotu",
                `Nie udało się znaleźć przedmiotu o nazwie **${itemName}**.`,
            );
        }

        const user = api.executor;
        const hasItem = await user.inventory.hasItem(item.id);

        if (!hasItem) {
            return api.log.replyError(
                api,
                "Nie masz tego przedmiotu!",
                `Nie posiadasz **${item.name}** w swoim ekwipunku.`,
            );
        }

        if (item.onUse.length == 0) {
            return api.log.replyError(
                api,
                "Tego przedmiotu nie da się użyć!",
                `Przedmiot **${item.name}** jest tylko kolekcjonerski. Więc jeśli kupiłeś go z myślą o nagrodzie to musze cię zmartwić 💔.`,
            );
        }

        await user.inventory.removeItem(item.id);

        try {
            const executed = await api.economy.executeActions(item.onUse);

            let embeds: ReplyEmbed[] = [];
            for (const action of executed) {
                const embed = formatAction(api, action);
                if (!embed) continue;
                embeds.push(embed);
            }

            if (embeds.length > 10) embeds = embeds.slice(0, 10);

            return api.reply({ embeds });
        } catch (err) {
            output.err(err);

            return api.log.replyError(
                api,
                "Coś poszło nie tak...",
                `Coś się rozjebało z ekonomią ig. To nie mój problem.\n**Error code:** ${err}`,
            );
        }
    },
};
