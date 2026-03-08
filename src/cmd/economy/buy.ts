import { cfg } from '@/bot/cfg.js';
import { Command, CommandFlags } from '@/bot/command.js';
import { PredefinedColors } from '@/util/color.js';
import { output } from '@/bot/logging.js';
import { formatMoney } from '@/util/math/format.js';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.js';

export const buyCmd: Command = {
    name: 'buy',
    aliases: ['kup'],
    description: {
        main: 'Masz masę kasy i nie wiesz co z nią zrobić? Pomogę Ci! Kup coś!',
        short: 'Kupuje wybrany przedmiot.'
    },
    flags: CommandFlags.Economy,

    expectedArgs: [
        {
            name: 'offer',
            type: 'trailing-string',
            optional: false,
            description: 'Jakaś rzecz, którą chcesz kupić.'
        }
    ],

    permissions: {
        allowedRoles: null,
        allowedUsers: null
    },

    async execute(api) {
        const offerName = api.getTypedArg('offer', 'trailing-string')?.value ?? '';

        const offer = api.economy.getOfferByName(offerName);
        if (!offer) {
            return api.log.replyError(
                api,
                'Coś takiego w ogóle istnieje?',
                `Nie udało się znaleźć oferty o nazwie **${offerName}**.`
            );
        }

        try {
            const user = api.executor;
            const userBalance = await user.economy.getBalance();

            if (userBalance.wallet < offer.price) {
                api.log.replyError(
                    api,
                    'Nie stać Cię!',
                    `Nie stać Cię na **${offer.name}**. Brakuje Ci **${formatMoney(offer.price - userBalance.wallet)}**.`
                );
                if (userBalance.bank + userBalance.wallet >= offer.price) {
                    return api.log.replyTip(
                        api, 'Wskazówka',
                        'Za przedmioty możesz płacić tylko pieniędzmi z portfela, jednak w banku masz wystarczającą ilość pieniędzy by kupić ten przedmiot.\n**Spróbuj troche wypłacić!**',
                    );
                }
                return;
            }

            await user.economy.deductWalletMoney(offer.price);
            await api.economy.executeActions(offer.onBuy);

            const embed = new ReplyEmbed()
                .setColor(PredefinedColors.Green)
                .setTitle('Zakup udany!')
                .setDescription(`Kupiłeś **${offer.name}** za **${formatMoney(offer.price)}**.\n${offer.desc}`);

            return api.reply({ embeds: [embed] });
        } catch (err) {
            output.err(err);

            return api.log.replyError(
                api,
                'Coś poszło bardzo nie tak...',
                'Spróbuj ponownie później.'
            );
        }
    }
};
