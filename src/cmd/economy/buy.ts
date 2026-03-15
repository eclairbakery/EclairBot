import { Command} from "@/bot/command.ts";
import { CommandFlags } from '@/bot/apis/commands/misc.ts';
import { PredefinedColors } from '@/util/color.ts';
import { output } from '@/bot/logging.ts';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.ts';
import Money from '@/util/money.ts';

export const buyCmd: Command = {
    name: 'buy',
    aliases: [],
    description: {
        main: 'Masz masę kasy i nie wiesz co z nią zrobić? Pomogę Ci! Kup coś!',
        short: 'Kupuje wybrany przedmiot.'
    },
    flags: CommandFlags.Economy,

    expectedArgs: [
        {
            name: 'offer',
            type: { base: 'string', trailing: true },
            optional: false,
            description: 'Jakaś rzecz, którą chcesz kupić.'
        }
    ],

    permissions: {
        allowedRoles: null,
        allowedUsers: null
    },

    async execute(api) {
        const offerName = api.getTypedArg('offer', 'string')?.value ?? '';

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

            if (offer.buyOnce && await user.purchases.getPurchaseCount(offer.id) >= 1) {
                return api.log.replyError(
                    api,
                    'To jednorazowa oferta!',
                    `Już kupiłeś **${offer.name}** i nie możesz zrobić tego ponownie.`
                );
            }

            const userBalance = await user.economy.getBalance();
            const price = Money.fromDollars(offer.price);

            if (userBalance.wallet.lessThan(price)) {
                api.log.replyError(
                    api,
                    'Nie stać Cię!',
                    `Nie stać Cię na **${offer.name}**. Brakuje Ci **${price.sub(userBalance.wallet).format()}**.`
                );

                const totalBalance = userBalance.wallet.add(userBalance.bank);
                if (totalBalance.greaterThanOrEqual(price)) {
                    return api.log.replyTip(
                        api, 'Wskazówka',
                        'Za przedmioty możesz płacić tylko pieniędzmi z portfela, jednak w banku masz wystarczającą ilość pieniędzy by kupić ten przedmiot.\n**Spróbuj troche wypłacić!**',
                    );
                }
                return;
            }

            await user.economy.deductWalletMoney(price);
            await api.economy.executeActions(offer.onBuy);

            await user.purchases.add(offer.id);

            const embed = new ReplyEmbed()
                .setColor(PredefinedColors.Green)
                .setTitle('Zakup udany!')
                .setDescription(`Kupiłeś **${offer.name}** za **${price.format()}**.\n${offer.desc}`);

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
