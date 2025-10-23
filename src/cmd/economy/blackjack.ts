import * as dsc from 'discord.js';
import { PredefinedColors } from '@/util/color.js';
import { dbGet, dbRun } from '@/util/db-utils.js';
import { Command, CommandAPI, CommandFlags } from '@/bot/command.js';

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

    permissions: { discordPerms: null, allowedRoles: null, allowedUsers: null },
    expectedArgs: [{ name: 'amount', description: 'O ile gramy?', optional: false, type: 'number' }],

    async execute(api: CommandAPI) {
        const betArg = api.getTypedArg('amount', 'number');
        const bet = betArg?.value as number;
        if (!bet || bet <= 0) {
            return api.msg.reply('❌ Podaj poprawną kwotę zakładu.');
        }

        const userId = api.msg.author.id;
        const row = await dbGet('SELECT * FROM economy WHERE user_id = ?', [userId]);
        if ((row?.money ?? 0) < bet) return api.msg.reply('❌ Nie masz wystarczającej ilości pieniędzy.');

        let playerHand: Card[] = [drawCard(), drawCard()];
        let dealerHand: Card[] = [drawCard(), drawCard()];

        const hitBtn = new dsc.ButtonBuilder().setCustomId('hit').setLabel('Hit').setStyle(dsc.ButtonStyle.Primary);
        const standBtn = new dsc.ButtonBuilder().setCustomId('stand').setLabel('Stand').setStyle(dsc.ButtonStyle.Secondary);
        const rowBtns = new dsc.ActionRowBuilder<dsc.ButtonBuilder>().addComponents(hitBtn, standBtn);

        let gameOver = false;

        const getEmbed = (hideDealer = true): dsc.EmbedBuilder => {
            const dealerShown = hideDealer ? `${dealerHand[0].name} ❓` : handToString(dealerHand);
            return new dsc.EmbedBuilder()
                .setTitle('♠️ Blackjack ♠️')
                .setColor(PredefinedColors.Green)
                .addFields(
                    { inline: true, name: 'Twoje karty', value: `${handToString(playerHand)} (${calcHandValue(playerHand)})` },
                    { inline: true, name: 'Karty dealera', value: `${dealerShown}${hideDealer ? '' : ` (${calcHandValue(dealerHand)})`}` }
                );
        };

        const gameMsg = await api.msg.reply({ embeds: [getEmbed()], components: [rowBtns] });

        const collector = gameMsg.createMessageComponentCollector({
            time: 30000,
            filter: ((i: dsc.ButtonInteraction) => i.user.id === userId) as any
        });

        collector.on('collect', async (button: dsc.ButtonInteraction) => {
            if (gameOver) return;

            if (button.customId === 'hit') {
                playerHand.push(drawCard());
                if (calcHandValue(playerHand) > 21) {
                    await dbRun('UPDATE economy SET money = money - ? WHERE user_id = ?', [bet, userId]);
                    gameOver = true;
                    await button.update({ embeds: [getEmbed(false).setDescription('💥 Przegrałeś! Przekroczyłeś 21.')], components: [] });
                    collector.stop();
                    return;
                }
                await button.update({ embeds: [getEmbed()], components: [rowBtns] });
            }

            if (button.customId === 'stand') {
                while (calcHandValue(dealerHand) < 17) dealerHand.push(drawCard());

                const playerValue = calcHandValue(playerHand);
                const dealerValue = calcHandValue(dealerHand);
                let result: string;

                if (dealerValue > 21 || playerValue > dealerValue) {
                    await dbRun('UPDATE economy SET money = money + ? WHERE user_id = ?', [bet, userId]);
                    result = '🏆 Wygrałeś!';
                } else if (playerValue === dealerValue) {
                    result = '🤝 Remis!';
                } else {
                    await dbRun('UPDATE economy SET money = money - ? WHERE user_id = ?', [bet, userId]);
                    result = '💥 Przegrałeś!';
                }

                gameOver = true;
                await button.update({ embeds: [getEmbed(false).setDescription(result)], components: [] });
                collector.stop();
            }
        });

        collector.on('end', async () => {
            if (!gameOver) {
                await gameMsg.edit({ embeds: [getEmbed(false).setDescription('⏳ Czas minął!')], components: [] });
            }
        });
    }
};
