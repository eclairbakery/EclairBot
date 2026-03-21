import * as dsc from 'discord.js';

import { PredefinedColors } from '@/util/color.ts';
import { Command } from '@/bot/command.ts';
import { CommandFlags } from '@/bot/apis/commands/misc.ts';
import { CommandAPI } from '@/bot/apis/commands/api.ts';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.ts';
import Money from '@/util/money.ts';

const Suits = [
    { name: 'Hearts', emoji: '♥️' },
    { name: 'Diamonds', emoji: '♦️' },
    { name: 'Clubs', emoji: '♣️' },
    { name: 'Spades', emoji: '♠️' },
];
const Ranks = [
    { name: 'A', value: 11 },
    { name: 'K', value: 10 },
    { name: 'Q', value: 10 },
    { name: 'J', value: 10 },
    { name: '10', value: 10 },
    { name: '9', value: 9 },
    { name: '8', value: 8 },
    { name: '7', value: 7 },
    { name: '6', value: 6 },
    { name: '5', value: 5 },
    { name: '4', value: 4 },
    { name: '3', value: 3 },
    { name: '2', value: 2 },
];

interface Card {
    rank: string;
    suit: string;
    value: number;
}

class BlackjackGame {
    deck: Card[] = [];
    playerHand: Card[] = [];
    dealerHand: Card[] = [];

    api: CommandAPI;
    currentBet: Money;
    initialBet: Money;

    gameOver = false;
    gameMsg?: dsc.Message;

    constructor(
        api: CommandAPI,
        initialBet: Money,
    ) {
        this.api = api;
        this.initialBet = initialBet;
        this.currentBet = initialBet;
    }

    async start() {
        const player = this.api.executor;

        const activeGames = await player.games.getActive();
        if (activeGames.length > 0) {
            return this.api.log.replyError(this.api, 'Już grasz w jakąś grę!', `Musisz najpierw skończyć gre w ${activeGames.map((s) => `**${s}**`).join(', ')}`);
        }

        const playerBalance = await player.economy.getBalance();
        if (playerBalance.wallet.lessThan(this.initialBet)) {
            return this.api.log.replyError(this.api, 'Nie masz wystarczającej ilości pieniędzy.', 'Może nie zdążyłeś ich wypłacić?');
        }

        await player.economy.deductWalletMoney(this.initialBet);
        await player.games.add('blackjack');

        this.deck = this.createDeck(4);
        this.playerHand = [this.drawCard(), this.drawCard()];
        this.dealerHand = [this.drawCard(), this.drawCard()];

        if (this.isBlackjack(this.playerHand) || this.isBlackjack(this.dealerHand)) {
            return this.handleImmediateBlackjack();
        }

        const canDouble = playerBalance.wallet.greaterThanOrEqual(this.initialBet.mul(2));
        this.gameMsg = await this.api.reply({
            embeds: [this.getEmbed()],
            components: this.getComponents(true, canDouble),
        });

        this.createCollector();
    }

    createDeck(numDecks: number): Card[] {
        const deck: Card[] = [];
        for (let d = 0; d < numDecks; d++) {
            for (const suit of Suits) {
                for (const rank of Ranks) {
                    deck.push({ rank: rank.name, suit: suit.emoji, value: rank.value });
                }
            }
        }
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    }

    drawCard(): Card {
        return this.deck.pop()!;
    }

    calculateHandValue(hand: Card[]): { value: number; soft: boolean } {
        let value = 0;
        let aces = 0;
        for (const card of hand) {
            value += card.value;
            if (card.rank == 'A') aces++;
        }

        let soft = aces > 0 && value <= 21;
        while (value > 21 && aces > 0) {
            value -= 10;
            aces--;
            soft = aces > 0 && value <= 21;
        }
        return { value, soft };
    }

    isBlackjack(hand: Card[]): boolean {
        return hand.length == 2 && this.calculateHandValue(hand).value == 21;
    }

    handToString(hand: Card[]): string {
        return hand.map((c) => `\`[${c.rank}${c.suit}]\``).join(' ');
    }

    getEmbed(hideDealer = true, resultDesc?: string, color: number = PredefinedColors.Green): ReplyEmbed {
        const playerInfo = this.calculateHandValue(this.playerHand);
        const dealerInfo = this.calculateHandValue(this.dealerHand);

        const dealerShown = hideDealer
            ? `${this.handToString([this.dealerHand[0]])} \`[❓]\``
            : this.handToString(this.dealerHand);

        const embed = new ReplyEmbed()
            .setTitle('♠️ Blackjack ♠️')
            .setColor(color)
            .addFields(
                {
                    inline: true,
                    name: 'Twoje karty',
                    value: [
                        `${this.handToString(this.playerHand)}`,
                        `**Suma: **${playerInfo.value}${playerInfo.soft ? ' (Soft)' : ''}`
                    ].join('\n'),
                },
                {
                    inline: true,
                    name: 'Karty dealera',
                    value: [
                        `${dealerShown}`,
                        `**Suma: **${hideDealer ? '?' : dealerInfo.value}${!hideDealer && dealerInfo.soft ? ' (Soft)' : ''}`
                    ].join('\n'),
                },
            )
            .setFooter({ text: `Zakład: ${this.currentBet.format()}` });

        if (resultDesc) embed.setDescription(resultDesc);
        return embed;
    }

    mkButton(id: string, label: string, style = dsc.ButtonStyle.Primary): dsc.ButtonBuilder {
        return new dsc.ButtonBuilder()
            .setCustomId(id)
            .setLabel(label)
            .setStyle(style);
    }

    getComponents(isFirstTurn: boolean, canDouble: boolean): dsc.ActionRowBuilder<dsc.ButtonBuilder>[] {
        const hitBtn = this.mkButton('hit', 'Hit');
        const standBtn = this.mkButton('stand', 'Stand');

        const row = new dsc.ActionRowBuilder<dsc.ButtonBuilder>()
            .addComponents(hitBtn, standBtn);

        if (isFirstTurn) {
            const doubleBtn = this.mkButton('double', 'Double Down', dsc.ButtonStyle.Danger);
            if (!canDouble) doubleBtn.setDisabled(true);
            row.addComponents(doubleBtn);
        }

        return [row];
    }

    async handleImmediateBlackjack() {
        this.gameOver = true;
        await this.api.executor.games.remove('blackjack');

        let result: string;
        let color: number;

        if (this.isBlackjack(this.playerHand) && this.isBlackjack(this.dealerHand)) {
            await this.api.executor.economy.addWalletMoney(this.currentBet);
            result = '🤝 **Remis!** Oboje macie Blackjacka.';
            color = PredefinedColors.Yellow;
        } else if (this.isBlackjack(this.playerHand)) {
            const payout = this.currentBet.mul(5).div(2); // 5 / 2 = 2.5
            await this.api.executor.economy.addWalletMoney(payout);
            result = `🎗️ **Blackjack!** Wygrałeś **${payout.sub(this.currentBet).format()}**!`;
            color = PredefinedColors.Green;
        } else {
            result = `💔 **Dealer ma Blackjacka!** Przegrałeś **${this.currentBet.format()}**. Przykra strata.`;
            color = PredefinedColors.Red;
        }

        return this.api.reply({
            embeds: [this.getEmbed(false, result, color)],
            components: [],
        });
    }

    createCollector() {
        if (!this.gameMsg) return;

        const collector = this.gameMsg.createMessageComponentCollector({
            time: 60000,
            filter: (i) => i.user.id == this.api.invoker.id,
        });

        collector.on('collect', async (i: dsc.ButtonInteraction) => {
            if (this.gameOver) return;

            if (i.customId == 'hit') {
                this.playerHand.push(this.drawCard());
                const playerValue = this.calculateHandValue(this.playerHand).value;

                if (playerValue > 21) {
                    await this.finish(i, `💥 Przegrałeś **${this.currentBet.format()}**! Przekroczyłeś 21.`, PredefinedColors.Red);
                } else {
                    await i.update({ embeds: [this.getEmbed()], components: this.getComponents(false, false) });
                }
            } else if (i.customId == 'double') {
                await this.api.executor.economy.deductWalletMoney(this.initialBet);
                this.currentBet = this.currentBet.add(this.initialBet);
                this.playerHand.push(this.drawCard());

                if (this.calculateHandValue(this.playerHand).value > 21) {
                    await this.finish(i, `💥 Przegrałeś **${this.currentBet.format()}**! Przekroczyłeś 21 po podwojeniu.`, PredefinedColors.Red);
                } else {
                    await this.resolveDealer(i);
                }
            } else if (i.customId == 'stand') {
                await this.resolveDealer(i);
            }
        });

        collector.on('end', async () => {
            if (!this.gameOver) {
                await this.api.executor.games.remove('blackjack');
                if (this.gameMsg) {
                    await this.gameMsg.edit({
                        embeds: [
                            this.getEmbed(false,
                                '⏳ **Czas minął!** Wszystkie twoje ciężko zarobione pieniądze które włożyłeś w ten zakład właśnie przepadły hahaha',
                                PredefinedColors.Red),
                        ],
                        components: [],
                    }).catch(() => {});
                }
            }
        });
    }

    async resolveDealer(i: dsc.ButtonInteraction) {
        let dealerInfo = this.calculateHandValue(this.dealerHand);
        while (dealerInfo.value < 17 || (dealerInfo.value == 17 && dealerInfo.soft)) {
            this.dealerHand.push(this.drawCard());
            dealerInfo = this.calculateHandValue(this.dealerHand);
        }

        const playerValue = this.calculateHandValue(this.playerHand).value;
        const dealerValue = dealerInfo.value;
        let result: string;
        let color = PredefinedColors.Green;

        if (dealerValue > 21) {
            await this.api.executor.economy.addWalletMoney(this.currentBet.mul(2));
            result = `🏆 **Dealer przekroczył 21!** Wygrałeś **${this.currentBet.format()}**!`;
        } else if (playerValue > dealerValue) {
            await this.api.executor.economy.addWalletMoney(this.currentBet.mul(2));
            result = `🏆 **Zwycięstwo!** Wygrałeś **${this.currentBet.format()}**! *(${playerValue} vs ${dealerValue})*`;
        } else if (playerValue == dealerValue) {
            await this.api.executor.economy.addWalletMoney(this.currentBet);
            result = `🤝 **Remis!** (${playerValue} vs ${dealerValue})`;
            color = PredefinedColors.Yellow;
        } else {
            result = `💥 **Przegrałeś!** Straty finansowe wynoszą **${this.currentBet.format()}** 🥀 *(${playerValue} vs ${dealerValue})*`;
            color = PredefinedColors.Red;
        }

        await this.finish(i, result, color);
    }

    async finish(i: dsc.ButtonInteraction, result: string, color: number) {
        this.gameOver = true;
        await this.api.executor.games.remove('blackjack');
        await i.update({
            embeds: [this.getEmbed(false, result, color)],
            components: [],
        });
    }
}

export const blackjackCmd: Command = {
    name: 'blackjack',
    aliases: ['bj'],
    description: {
        main: 'Gra w blackjacka za określoną kwotę',
        short: 'Gra w blackjacka za określoną kwotę',
    },
    flags: CommandFlags.Economy,

    permissions: { allowedRoles: null, allowedUsers: null },
    expectedArgs: [
        {
            name: 'amount',
            description: 'O ile gramy?',
            optional: false,
            type: { base: 'money', source: 'wallet' },
        },
    ],

    async execute(api: CommandAPI) {
        const amount = api.getTypedArg('amount', 'money').value;
        if (amount.isZero() || amount.isNegative()) {
            return api.log.replyError(api, 'Namieszałeś z kwotą.', 'Podaj poprawną kwotę!');
        }

        const game = new BlackjackGame(api, amount);
        await game.start();
    },
};
