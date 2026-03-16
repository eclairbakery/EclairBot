import { Command } from '@/bot/command.ts';
import { CommandFlags } from '@/bot/apis/commands/misc.ts';
import { output } from '@/bot/logging.ts';
import Money from '@/util/money.ts';
import { cfg } from '../../bot/cfg.ts';

export const buyCmd: Command = {
    name: 'buy',
    aliases: [],
    description: {
        main: 'Masz masę kasy i nie wiesz co z nią zrobić? Pomogę Ci! Kup coś!',
        short: 'Kupuje wybrany przedmiot.',
    },
    flags: CommandFlags.Economy,

    expectedArgs: [
        {
            name: 'offer',
            type: { base: 'string', trailing: true },
            optional: false,
            description: 'Jakaś rzecz, którą chcesz kupić.',
        },
    ],

    permissions: {
        allowedRoles: null,
        allowedUsers: null,
    },

    async execute(api) {
        const offerName = api.getTypedArg('offer', 'string')?.value ?? '';

        const offer = api.economy.getOfferByName(offerName);
        if (!offer) {
            return api.log.replyError(
                api,
                'Coś takiego w ogóle istnieje?',
                `Nie udało mi się znaleźć oferty o nazwie **${offerName}**. Albo jestem ślepy, w co `,
            );
        }

        try {
            const user = api.executor;

            if (offer.buyOnce && await user.purchases.getPurchaseCount(offer.id) >= 1) {
                return api.log.replyError(
                    api,
                    'To jednorazowa oferta!',
                    `Już kupiłeś **${offer.name}** i nie możesz zrobić tego ponownie.`,
                );
            }

            const userBalance = await user.economy.getBalance();
            const price = Money.fromDollars(offer.price);

            if (userBalance.wallet.lessThan(price)) {
                const msg = await api.log.replyError(
                    api,
                    'Jesteś biedny...',
                    `Nie stać Cię na **${offer.name}**. Brakuje Ci **${price.sub(userBalance.wallet).format()}**.`,
                );

                const totalBalance = userBalance.wallet.add(userBalance.bank);
                if (totalBalance.greaterThanOrEqual(price)) {
                    msg.edit({
                        embeds: [
                            ...msg.embeds,
                            api.log.getTipEmbed(
                                'Wskazówka',
                                'Za przedmioty możesz płacić tylko pieniędzmi z portfela, jednak w banku masz wystarczającą ilość pieniędzy by kupić ten przedmiot.\n**Spróbuj troche wypłacić!**',
                            )
                        ]
                    }); 
                }
                return;
            }

            await user.economy.deductWalletMoney(price);
            await api.economy.executeActions(offer.onBuy);

            await user.purchases.add(offer.id);

            return await api.log.replySuccess(
                api, 'Zakup udany!',
                `Kupiłeś **${offer.name}** za **${price.format()}**.\n\n- **Opis:** ${offer.desc}\n` +
                `- **Pozostałe pieniądze:**\n  - w portfelu: ${userBalance.wallet.sub(price).format()}\n  - w banku: ${userBalance.bank.format()}` +
                `\n\n-# Użyj \`${cfg.commands.prefix}use\`, aby użyć to co kupiłeś...`
            )
        } catch (err) {
            output.err(err);

            return api.log.replyError(
                api,
                'Coś poszło bardzo nie tak...',
                'Spróbuj ponownie później.',
            );
        }
    },
};
