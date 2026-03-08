import { formatMoney } from '@/util/math/format.js';
import { cfg } from "@/bot/cfg.js";
import { Command, CommandAPI, CommandFlags } from "@/bot/command.js";
import { PredefinedColors } from "@/util/color.js";
import { APIEmbedField } from "discord.js";
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.js';
import { ConfigEconomyAction } from '@/bot/definitions/economy.js';

function formatItemActions(api: CommandAPI, actions: ConfigEconomyAction[]): string[] {
    let result: string[] = [];
    for (const action of actions) {
        switch (action.op) {
        case 'add-role':
            const role = api.economy.getRoleById(action.roleId);
            result.push(`Daje rolę <@&${role?.discordRoleId}>`);
        default:
            
        }
        // TODO
    }
    return result;
}

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
        allowedRoles: null,
        allowedUsers: null
    },

    execute(api) {
        let fields: APIEmbedField[] = [];
        cfg.features.economy.offers.sort((a, b) => a.price - b.price).forEach((offer) => {
            fields.push({
                name: offer.name,
                value: [
                    `${formatMoney(offer.price)} - ${offer.desc}`,
                    ...formatItemActions(api, offer.onBuy),
                ].join('\n')
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
