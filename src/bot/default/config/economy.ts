import EconomyConfig from "@/bot/definitions/config/economy.js";
import { PredefinedColors } from "@/util/color.js";

export const economyCfg: EconomyConfig = {
    roles: [
        {
            id: 'minivip',
            name: 'miniVIP',
            desc: 'Taki VIP ale na sterydach.',
            discordRoleId: '1235550013233303582',
            benefits: {
                multipliers: [
                    { filter: '*', multiplier: 1.05 } // +5%
                ],
                dailyIncome: [ { op: 'add-money', amount: 250 } ],
            }
        },
        {
            id: 'vip',
            name: 'VIP',
            desc: 'Szanowny pan VIP.',
            discordRoleId: '1235548993933541397',
            benefits: {
                multipliers: [
                    { filter: '*', multiplier: 1.10 } // +10%
                ],
                dailyIncome: [ { op: 'add-money', amount: 800 } ],
            }
        },
        {
            id: 'svip',
            name: 'SVIP',
            desc: 'Jeszcze szanowniejszy pan SVIP.',
            discordRoleId: '1235550115998076948',
            benefits: {
                multipliers: [
                    { filter: '*', multiplier: 1.20 } // +20%
                ],
                dailyIncome: [ { op: 'add-money', amount: 2000 } ],
            }
        },
        {
            id: 'mvip',
            name: 'MVIP',
            desc: 'Mega szanowny pan MVIP.',
            discordRoleId: '1235569694451306516',
            benefits: {
                multipliers: [
                    { filter: '*', multiplier: 1.35 } // +35%
                ],
                dailyIncome: [ { op: 'add-money', amount: 5000 } ],
            }
        },
        {
            id: 'pieczywo-vip',
            name: 'Pieczywo VIP',
            desc: 'Pieczywo VIP - Final Boss.',
            discordRoleId: '1343632574437920799',
            benefits: {
                multipliers: [
                    { filter: '*', multiplier: 1.80 } // +80%
                ],
                dailyIncome: [ { op: 'add-money', amount: 20_000 } ],
            }
        },
        {
            id: 'hall-of-shame-access',
            name: 'Hall of Shame Access',
            desc: 'Dostęp do kanału Hall of Shame.',
            discordRoleId: '1437780651356196864',
            benefits: {
                multipliers: [],
                dailyIncome: [],
            }
        }
    ],
    items: [],
    offers: [
        {
            id: 'buy-minivip',
            name: 'miniVIP',
            desc: 'Taki VIP ale na sterydach. Nie możesz się poflexować, bo ma mini w nazwie i będą myśleli, że cię nie stać...',
            price: 5_000,
            buyOnce: true,
            onBuy: [
                { op: 'add-role', roleId: 'minivip' },
            ],
        },
        {
            id: 'buy-vip',
            name: 'VIP',
            desc: 'Nie wiem poflexuj się rangą która jest na końcu listy, ale hej - dalej jesteś VIP\'em.',
            price: 40_000,
            buyOnce: true,
            onBuy: [
                { op: 'add-role', roleId: 'vip' },
            ],
        },
        {
            id: 'buy-svip',
            name: 'SVIP',
            desc: 'Już lepszy VIP. Nie wiem co Ci daje to ciągłe upgradeowanie VIP\'ów, ale musi coś dawać, bo inaczej byś tego nie robił :wilted_rose:',
            price: 300_000,
            buyOnce: true,
            onBuy: [
                { op: 'add-role', roleId: 'svip' },
            ],
        },
        {
            id: 'buy-mvip',
            name: 'MVIP',
            desc: 'Kolejna generacja VIPa, której prawdopodobnie nie użyjesz...',
            price: 1_250_000,
            buyOnce: true,
            onBuy: [
                { op: 'add-role', roleId: 'mvip' },
            ],
        },
        {
            id: 'buy-pieczywo-vip',
            name: 'Pieczywo VIP',
            desc: 'VIP Final Boss. Daje ci aż 80% większe zarobki!',
            price: 8_000_000,
            buyOnce: true,
            onBuy: [
                { op: 'add-role', roleId: 'pieczywo-vip' },
            ],
        },

        {
            id: 'buy-hall-of-shame-access',
            name: 'Hall of Shame Access',
            desc: 'Mamy taki fajny kanał zwany `Hall of Shame`! Właśnie dostaniesz do niego dostęp, wystarczy tylko, że ten przedmiot zostanie przez ciebie kupiony',
            price: 10_000_000,
            buyOnce: true,
            onBuy: [
                { op: 'add-role', roleId: 'hall-of-shame-access' },
            ],
        }
    ],
    shop: [
        {
            id: 'vips',
            name: 'VIPy',
            desc: 'Poczuj się jak prawdziwy VIP. No i masz jakiś tam multiplier do zarabiania.',
            color: PredefinedColors.Yellow,
            emoji: '😎',
            items: [ 'buy-minivip', 'buy-vip', 'buy-svip', 'buy-mvip', 'buy-pieczywo-vip' ],
        },
        {
            id: 'boxes',
            name: 'Mystery Boxes',
            desc: 'Misterne skrzynki. Otwórz i zgarnij świetne nagrody',
            color: PredefinedColors.Blurple,
            emoji: '📦',
            items: [],
        },
        {
            id: 'others',
            name: 'Inne',
            desc: 'Oferty które nie pasowały do żadnej kategorii',
            color: PredefinedColors.Teal,
            emoji: '🎗️',
            items: [ 'buy-hall-of-shame-access' ],
        },
    ],
    currencySign: '$',
    currencySignPlacement: 'left',
}