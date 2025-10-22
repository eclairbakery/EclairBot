import { cfg } from "@/bot/cfg.js";
import { Command, CommandFlags } from "@/bot/command.js";
import { PredefinedColors } from "@/util/color.js";
import { APIEmbedField, EmbedBuilder } from "discord.js";

export const shopCmd: Command = {
    name: 'shop',
    aliases: [],
    description: {
        main: 'Idź do jakiegoś Times Square i kup jakiś bezsensowny bullshit 10 razy drożej niż gdzie indziej.',
        short: 'Odwiedź sklep.'
    },
    flags: CommandFlags.Economy,
    expectedArgs: [],
    permissions: {
        discordPerms: null,
        allowedRoles: null,
        allowedUsers: null
    },

    execute(api) {
        let fields: APIEmbedField[] = [];
        cfg.economy.shop.sort((a, b) => a.price - b.price).forEach((shopItem) => {
            fields.push({
                name: shopItem.name,
                value: `${shopItem.price}💸 - ${shopItem.description} (daje <@&${shopItem.role}>)`
            });
        });
        api.msg.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle('💳 Sklep')
                    .setDescription('Aktualnie to jeszcze nie możesz nic kupić, ale możesz popatrzeć co mamy...')
                    .addFields(fields)
                    .setColor(PredefinedColors.Blurple)
            ]
        });
    },
};