import { formatMoney } from '@/util/math/format.js';
import { cfg } from "@/bot/cfg.js";
import { Command, CommandFlags } from "@/bot/command.js";
import { PredefinedColors } from "@/util/color.js";
import { APIEmbedField, EmbedBuilder } from "discord.js";
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.js';

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
        cfg.features.economy.shop.sort((a, b) => a.price - b.price).forEach((shopItem) => {
            fields.push({
                name: shopItem.name,
                value: `${formatMoney(shopItem.price)} - ${shopItem.description} (daje <@&${shopItem.role}>)`
            });
        });
        api.reply({
            embeds: [
                new ReplyEmbed()
                    .setTitle('💳 Sklep')
                    .setDescription('Aktualnie to jeszcze nie możesz nic kupić, ale możesz popatrzeć co mamy...')
                    .addFields(fields)
                    .setColor(PredefinedColors.Blurple)
            ]
        });
    },
};
