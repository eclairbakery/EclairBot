import * as dsc from 'discord.js';

import User from '@/bot/apis/db/user.js';

import { PredefinedColors } from '@/util/color.js';
import { Command, CommandAPI, CommandFlags } from '@/bot/command.js';
import { db } from '@/bot/apis/db/bot-db.js';
import { cfg } from '@/bot/cfg.js';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.js';

interface Card {
    name: string;
    value: number;
}

function drawCard(): Card {
    const cards: Card[] = [
        { name: 'A', value: 11 }, { name: 'K', value: 10 }, { name: 'Q', value: 10 }, { name: 'J', value: 10 },
        { name: '10', value: 10 }, { name: '9', value: 9 }, { name: '8', value: 8 }, { name: '7', value: 7 },
        { name: '6', value: 6 }, { name: '5', value: 5 }, { name: '4', value: 4 }, { name: '3', value: 3 }, { name: '2', value: 2 }
    ];
    return cards[Math.floor(Math.random() * cards.length)];
}

function calcHandValue(hand: Card[]): number {
    let value = 0, aces = 0;
    for (const card of hand) { value += card.value; if (card.name === 'A') aces++; }
    while (value > 21 && aces > 0) { value -= 10; aces--; }
    return value;
}

function handToString(hand: Card[]): string {
    return hand.map(c => c.name).join(' ');
}

export const blackjackCmd: Command = {
    name: 'blackjack',
    aliases: ['bj'],
    description: {
        main: 'Gra w blackjacka za określoną kwotę. Jak chcesz, możesz przewalić w kasynie kasę!',
        short: 'Gra w blackjacka za określoną kwotę',
    },
    flags: CommandFlags.Economy,

    permissions: { allowedRoles: null, allowedUsers: null },
    expectedArgs: [{ name: 'amount', description: 'O ile gramy?', optional: false, type: 'number' }],

    async execute(api: CommandAPI) {
        const betArg = api.getTypedArg('amount', 'number');
        const bet = betArg?.value as number;
        if (!bet || bet <= 0) {
            return api.log.replyError(api, cfg.customization.economyTexts.betWrongAmountHeader, cfg.customization.economyTexts.betWrongAmountText);
        }

        const userId = api.invoker.id;
        const player = api.executor;
        const playerBalance = await player.economy.getBalance();

        if (playerBalance.wallet < bet)
            return api.log.replyError(api, cfg.customization.economyTexts.balanceNotSufficientHeader, cfg.customization.economyTexts.balanceNotSufficientText);


        let playerHand: Card[] = [drawCard(), drawCard()];
        let dealerHand: Card[] = [drawCard(), drawCard()];

        const hitBtn = new dsc.ButtonBuilder().setCustomId('hit').setLabel('Hit').setStyle(dsc.ButtonStyle.Primary);
        const standBtn = new dsc.ButtonBuilder().setCustomId('stand').setLabel('Stand').setStyle(dsc.ButtonStyle.Secondary);
        const rowBtns = new dsc.ActionRowBuilder<dsc.ButtonBuilder>().addComponents(hitBtn, standBtn);

        let gameOver = false;

        const getEmbed = (hideDealer = true): ReplyEmbed => {
            const dealerShown = hideDealer ? `${dealerHand[0].name} ❓` : handToString(dealerHand);
            return new ReplyEmbed()
                .setTitle(cfg.customization.economyTexts.blackjack.title)
                .setColor(PredefinedColors.Green)
                .addFields(
                    { inline: true, name: cfg.customization.economyTexts.playerCardsLabel, value: `${handToString(playerHand)} (${calcHandValue(playerHand)})` },
                    { inline: true, name: cfg.customization.economyTexts.dealerCardsLabel, value: `${dealerShown}${hideDealer ? '' : ` (${calcHandValue(dealerHand)})`}` }
                );
        };

        const gameMsg = await api.reply({
            embeds: [getEmbed()],
            components: [rowBtns],
        });

        const collector = gameMsg.createMessageComponentCollector({
            time: 30000,
            filter: ((i: dsc.ButtonInteraction) => i.user.id === userId) as any
        });

        collector.on('collect', async (button: dsc.ButtonInteraction) => {
            if (gameOver) return;

            if (button.customId === 'hit') {
                playerHand.push(drawCard());
                if (calcHandValue(playerHand) > 21) {
                    await db.runSql('UPDATE economy SET money = money - ? WHERE user_id = ?', [bet, userId]);
                    gameOver = true;
                    await button.update({
                        embeds: [
                            getEmbed(false)
                                .setDescription(cfg.customization.economyTexts.blackjack.descriptionBust)
                        ],
                        components: [],
                    });
                    collector.stop();
                    return;
                }
                await button.update({
                    embeds: [
                        getEmbed()
                    ],
                    components: [rowBtns],
                });
            }

            if (button.customId === 'stand') {
                while (calcHandValue(dealerHand) < 17) dealerHand.push(drawCard());

                const playerValue = calcHandValue(playerHand);
                const dealerValue = calcHandValue(dealerHand);
                let result: string;

                if (dealerValue > 21 || playerValue > dealerValue) {
                    player.economy.addWalletMoney(bet);
                    result = cfg.customization.economyTexts.blackjack.descriptionWin;
                } else if (playerValue === dealerValue) {
                    result = cfg.customization.economyTexts.blackjack.descriptionDraw;
                } else {
                    player.economy.deductWalletMoney(bet);
                    result = cfg.customization.economyTexts.blackjack.descriptionLose;
                }

                gameOver = true;
                await button.update({
                    embeds: [
                        getEmbed(false)
                            .setDescription(result)
                    ],
                    components: [],
                });
                collector.stop();
            }
        });

        collector.on('end', async () => {
            if (!gameOver) {
                await gameMsg.edit({
                    embeds: [
                        getEmbed(false)
                            .setDescription(cfg.customization.economyTexts.blackjack.descriptionTimeout)
                    ],
                    components: [],
                });
            }
        });
    }
};
