import EconomyConfig from "@/bot/definitions/config/economy.js";
import { PredefinedColors } from "@/util/color.js";

export const economyCfg: EconomyConfig = {
    roles: [
        {
            id: 'minivip',
            name: 'miniVIP',
            desc: 'Taki słabszy VIP.',
            refund: 3_000,
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
            refund: 35_000,
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
            refund: 250_000,
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
            refund: 1_000_000,
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
            refund: 6_000_000,
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
            refund: 6_000_000,
            discordRoleId: '1437780651356196864',
            benefits: {
                multipliers: [],
                dailyIncome: [],
            }
        }
    ],
    items: [
        {
            id: 'basic-mysterybox',
            name: 'Zwykły Mystery Box',
            desc: 'Zwykły MysteryBox. Dobry na początek, zbalansowane nagrody.',
            directOfferId: 'buy-basic-mysterybox',
            onUse: [
                { op: 'random', variants: [
                    { weight: 20, actions: [ { op: 'add-role', roleId: 'minivip' } ] },
                    { weight: 33, actions: [ { op: 'add-role', roleId: 'vip' } ] },
                    { weight: 2,  actions: [ { op: 'add-role', roleId: 'svip' } ] },
                    { weight: 5,  actions: [ { op: 'add-item', itemId: 'mega-mysterybox' } ] },
                    { weight: 10, actions: [ { op: 'add-item', itemId: '5050-mysterybox' } ] },
                    { weight: 15, actions: [ { op: 'add-money', amount: 40_000 } ] },
                    { weight: 13, actions: [ { op: 'add-money', amount: 50_000 } ] },
                    { weight: 2,  actions: [ { op: 'add-money', amount: 100_000 } ] },
                ] }
            ],
        },
        {
            id: 'mega-mysterybox',
            name: 'Mega Mystery Box',
            desc: 'Mega Mystery Box. Znacznie lepsze nagrody niż zwykły mystery box, w tym VIPy, inne mystery boxy i pieniądze',
            directOfferId: 'buy-mega-mysterybox',
            onUse: [
                { op: 'random', variants: [
                    { weight: 30, actions: [ { op: 'add-role', roleId: 'svip' } ] },
                    { weight: 15, actions: [ { op: 'add-role', roleId: 'mvip' } ] },
                    { weight: 5,  actions: [ { op: 'add-item', itemId: 'ultra-mysterybox' } ] },
                    { weight: 5,  actions: [ { op: 'add-item', itemId: 'mega-mysterybox' } ] },
                    { weight: 10, actions: [ { op: 'add-item', itemId: '5050-mysterybox' } ] },
                    { weight: 15, actions: [ { op: 'add-money', amount: 250_000 } ] },
                    { weight: 10, actions: [ { op: 'add-money', amount: 450_000 } ] },
                    { weight: 8,  actions: [ { op: 'add-money', amount: 600_000 } ] },
                    { weight: 2,  actions: [ { op: 'add-money', amount: 1_000_000 } ] },
                ] },
            ],
        },
        {
            id: 'ultra-mysterybox',
            name: 'Ultra Mystery Box',
            desc: 'Najlepszy Mystery Box. Same najlepsze nagrody w late game!',
            directOfferId: 'buy-ultra-mysterybox',
            onUse: [
                { op: 'random', variants: [
                    { weight: 25, actions: [ { op: 'add-money', amount: 600_000 } ] },
                    { weight: 20, actions: [ { op: 'add-money', amount: 1_000_000 } ] },
                    { weight: 10, actions: [ { op: 'add-money', amount: 1_500_000 } ] },
                    { weight: 15, actions: [ { op: 'add-role', roleId: 'mvip' } ] },
                    { weight: 10, actions: [ { op: 'add-role', roleId: 'pieczywo-vip' } ] },
                    { weight: 5,  actions: [ { op: 'add-role', roleId: 'hall-of-shame-access' } ] },
                    { weight: 10, actions: [ { op: 'add-item', itemId: 'ultra-mysterybox' } ] },
                    { weight: 5,  actions: [ { op: 'add-item', itemId: '5050-mysterybox' } ] },
                ] },
            ],
        },
        {
            id: '5050-mysterybox',
            name: '50/50 Mystery Box',
            desc: 'Nagroda życia lub totalny sabotaż - 50/50!',
            directOfferId: 'buy-5050-mysterybox',
            onUse: [
                { op: 'random', variants: [
                    { actions: [
                        { op: 'random', variants: [
                            { weight: 50, actions: [ { op: 'add-money', amount: 3_000_000 } ] },
                            { weight: 25, actions: [ { op: 'add-role', roleId: 'pieczywo-vip' } ] },
                            { weight: 25, actions: [
                                { op: 'add-item', itemId: 'ultra-mysterybox' },
                                { op: 'add-item', itemId: 'ultra-mysterybox' },
                            ]},
                        ] }
                    ] },
                    { actions: [
                        { op: 'random', variants: [
                            { weight: 50, actions: [ { op: 'sub-money', amount: 500_000 } ] },
                            { weight: 30, actions: [ { op: 'sub-money', amount: 1_000_000 } ] },
                            // automatically removes mvip.refund money if user dont have mvip role
                            { weight: 20, actions: [ { op: 'rem-role', roleId: 'mvip' } ] },
                        ] }
                    ] },
                ] },
            ],
        },
    ],
    offers: [
        {
            id: 'buy-minivip',
            name: 'miniVIP',
            desc: 'Taki słabszy VIP. Nie możesz się poflexować, bo ma mini w nazwie i będą myśleli, że cię nie stać...',
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
        },

        {
            id: 'buy-basic-mysterybox',
            name: 'Zwykły Mystery Box',
            desc: 'Kup zwykły mystery box. Najtańszy mystery box, zbalansowane nagrody',
            price: 45_000,
            buyOnce: false,
            onBuy: [
                { op: 'add-item', itemId: 'basic-mysterybox' },
            ],
        },
        {
            id: 'buy-mega-mysterybox',
            name: 'Mega Mystery Box',
            desc: 'Kup Mega Mystery Box. Znacznie lepsze nagrody niż zwykły mystery box w tym VIPy, inne mystery boxy i pieniądze!',
            price: 500_000,
            buyOnce: false,
            onBuy: [
                { op: 'add-item', itemId: 'mega-mysterybox' },
            ],
        },
        {
            id: 'buy-ultra-mysterybox',
            name: 'Ultra Mystery Box',
            desc: 'Kup Ultra Mystery Box. Najlepszy mystery box, bardzo dobre nagrody w late game',
            price: 2_000_000,
            buyOnce: false,
            onBuy: [
                { op: 'add-item', itemId: 'ultra-mysterybox' },
            ],
        },
        {
            id: 'buy-5050-mysterybox',
            name: '50/50 Mystery Box',
            desc: 'Kup 50/50 Mystery Box. Nagroda życia lub totalny sabotaż - 50/50!',
            price: 1_000_000,
            buyOnce: false,
            onBuy: [
                { op: 'add-item', itemId: '5050-mysterybox' },
            ],
        },
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
            items: [ 'buy-basic-mysterybox', 'buy-mega-mysterybox', 'buy-ultra-mysterybox', 'buy-5050-mysterybox' ],
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
