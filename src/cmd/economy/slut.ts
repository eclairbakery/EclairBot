import { getRandomInt } from '@/util/math/rand.ts';

import { Command} from "@/bot/command.ts";
import { CommandFlags } from '@/bot/apis/commands/misc.ts';
import { PredefinedColors } from '@/util/color.ts';
import { output } from '@/bot/logging.ts';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.ts';

import Money from '@/util/money.ts';

const CooldownMs = 2 * 60 * 1000;
const SlutAmountMin = 500;
const SlutAmountMax = 1600;
const Percentage = 0.6;

type MessageCallback = (amount: Money) => string;
const SlutSuccessMessages: MessageCallback[] = [
    amount => `Pomogłeś komuś przenieść lodówkę na 4 piętro i dostałeś **${amount.format()}**. Twoje plecy już nie żyją.`,
    amount => `Wyprowadziłeś psa sąsiada i dostałeś **${amount.format()}**. Pies był bardziej profesjonalny od ciebie.`,
    amount => `Rozdawałeś ulotki pod sklepem i zarobiłeś **${amount.format()}**. 90% ludzi wyrzuciło je po 3 sekundach.`,
    amount => `Umyłeś komuś samochód na parkingu i dostałeś **${amount.format()}**.`,
    amount => `Pomogłeś komuś złożyć meble z IKEI i dostałeś **${amount.format()}**. Zostały tylko 3 śrubki.`,
    amount => `Złożyłeś komuś komputer z tutorialem z YouTube i dostałeś **${amount.format()}**.`,
    amount => `Naprawiłeś komuś WiFi restartując router i dostałeś **${amount.format()}**.`,
    amount => `Pomogłeś komuś z pracą domową i dostałeś **${amount.format()}**.`,
    amount => `Sprzedałeś stare rzeczy z piwnicy i zarobiłeś **${amount.format()}**.`,
    amount => `Zrobiłeś komuś logo w 5 minut w Paincie i dostałeś **${amount.format()}**.`,
    amount => `Zmontowałeś komuś filmik na TikToka i dostałeś **${amount.format()}**.`,
    amount => `Pomogłeś komuś przenieść kanapę i dostałeś **${amount.format()}**.`,
    amount => `Zrobiłeś komuś prezentację w PowerPoincie na ostatnią chwilę i zarobiłeś **${amount.format()}**.`,
    amount => `Znalazłeś drobne w automacie z napojami i uzbierało się **${amount.format()}**.`,
    amount => `Zagrałeś na gitarze na ulicy i ludzie wrzucili **${amount.format()}**.`,
    amount => `Pomogłeś komuś skonfigurować Discorda i dostałeś **${amount.format()}**.`,
    amount => `Sprzedałeś stare konto do gry i dostałeś **${amount.format()}**.`,
    amount => `Ktoś zapłacił ci **${amount.format()}** za zainstalowanie przeglądarki.`,
    amount => `Napisałeś komuś CV w 10 minut i dostałeś **${amount.format()}**.`,
    amount => `Zrobiłeś komuś zdjęcia na Instagrama i dostałeś **${amount.format()}**.`,
    amount => `Pomogłeś komuś ustawić telewizor i dostałeś **${amount.format()}**.`,
    amount => `Złożyłeś komuś biurko i dostałeś **${amount.format()}**.`,
    amount => `Znalazłeś stare monety w szufladzie i okazało się że są warte **${amount.format()}**.`,
    amount => `Sprzedałeś kabel którego nie używałeś od lat za **${amount.format()}**.`,
    amount => `Zrobiłeś komuś konfigurację routera i dostałeś **${amount.format()}**.`,
];
const SlutFailMessages: MessageCallback[] = [
    amount => `Próbowałeś rozdawać ulotki, ale ochroniarz wyrzucił cię po 2 minutach i dostałeś mandat na **${amount.format()}**.`,
    amount => `Chciałeś umyć komuś auto, ale porysowałeś lakier. Musiałeś zapłacić **${amount.format()}**.`,
    amount => `Pomagałeś komuś złożyć meble z IKEI, ale rozwaliłeś półkę i oddałeś **${amount.format()}** za szkody.`,
    amount => `Próbowałeś grać na ulicy, ale straż miejska kazała ci się zwinąć i zapłacić **${amount.format()}** kary.`,
    amount => `Wyprowadzałeś psa sąsiada, ale uciekł i musiałeś zapłacić **${amount.format()}** za ogłoszenia o zaginięciu.`,
    amount => `Chciałeś sprzedać stare rzeczy, ale ktoś cię oscamował i straciłeś **${amount.format()}**.`,
    amount => `Pomagałeś komuś z komputerem i przypadkiem usunąłeś mu pliki. Zapłaciłeś **${amount.format()}**.`,
    amount => `Próbowałeś zrobić komuś logo, ale klient zażądał zwrotu zaliczki **${amount.format()}**.`,
    amount => `Zgłosiłeś się do pracy dorywczej, ale okazało się że to scam i straciłeś **${amount.format()}**.`,
    amount => `Chciałeś pomóc komuś z zadaniem domowym, ale zrobiłeś je źle i oddałeś **${amount.format()}**.`,
    amount => `Próbowałeś sprzedać stare książki, ale zapłaciłeś **${amount.format()}** za wystawienie ogłoszeń które nic nie dały.`,
    amount => `Zgłosiłeś się do montowania filmiku, ale klient zniknął po tym jak zapłaciłeś **${amount.format()}** za materiały.`,
    amount => `Pomagałeś komuś przenieść kanapę i zniszczyłeś ścianę. Zapłaciłeś **${amount.format()}**.`,
    amount => `Próbowałeś sprzedać stare konto do gry, ale zostałeś oscamowany i straciłeś **${amount.format()}**.`,
    amount => `Chciałeś zrobić komuś zdjęcia, ale upuściłeś aparat i naprawa kosztowała **${amount.format()}**.`,
    amount => `Pomagałeś z internetem, ale zerwałeś kabel i musiałeś zapłacić **${amount.format()}**.`,
    amount => `Próbowałeś sprzedać lemoniadę, ale wylałeś wszystko i straciłeś **${amount.format()}** na składniki.`,
    amount => `Zgłosiłeś się do pomocy przy przeprowadzce i zbiłeś telewizor. Oddałeś **${amount.format()}**.`,
    amount => `Chciałeś złożyć komuś komputer, ale spaliłeś zasilacz i zapłaciłeś **${amount.format()}**.`,
    amount => `Próbowałeś dorobić na ulicy, ale straż miejska wlepiła ci mandat **${amount.format()}**.`,
    amount => `Chciałeś sprzedać coś na OLX, ale ktoś wyłudził od ciebie **${amount.format()}**.`,
    amount => `Próbowałeś naprawić telefon, ale ekran pękł jeszcze bardziej i oddałeś **${amount.format()}**.`,
    amount => `Pomagałeś komuś z komputerem i przypadkiem sformatowałeś dysk. Zapłaciłeś **${amount.format()}**.`,
    amount => `Próbowałeś zrobić komuś stronę internetową, ale klient zażądał zwrotu **${amount.format()}**.`,
    amount => `Zgłosiłeś się do dorywczej roboty, ale musiałeś kupić narzędzia za **${amount.format()}** i pracy i tak nie było.`,
];

export const slutCmd: Command = {
    name: 'slut',
    aliases: [],
    description: {
        main: 'Któżby się spodziewał, że będziesz pracować dorywczo?',
        short: 'Któżby się spodziewał, że będziesz pracować dorywczo?',
    },
    flags: CommandFlags.Economy,

    expectedArgs: [],
    permissions: {
        allowedRoles: null,
        allowedUsers: [],
    },

    async execute(api) {
        try {
            const result = await api.checkCooldown('slut', CooldownMs);
            if (!result.can) {
                const embed = new ReplyEmbed()
                    .setColor(PredefinedColors.Yellow)
                    .setTitle('Chwila przerwy!')
                    .setDescription(`Ktoś tam Ci każe czekać ${result.discordTime} sekund zanim znowu popr*cujesz dorywczo, żebyś nie naspamił komendami w chuja hajsu...`);

                return api.reply({ embeds: [embed] });
            }

            const amount = getRandomInt(SlutAmountMin, SlutAmountMax);
            const win = Math.random() < Percentage;
            
            const multiplier = api.economy.getMultiplier('slut');
            const total = win ? (amount * multiplier) : amount;
            const totalMoney = Money.fromDollarsFloat(total);

            if (win) await api.executor.economy.addWalletMoney(totalMoney);
            else await api.executor.economy.deductWalletMoney(totalMoney);
            
            await api.executor.cooldowns.set('slut', Date.now());

            let embed: ReplyEmbed;
            if (win) {
                const genMessage = SlutSuccessMessages[getRandomInt(0, SlutSuccessMessages.length-1)];
                embed = new ReplyEmbed()
                    .setColor(PredefinedColors.Blue)
                    .setTitle('Sukces!')
                    .setDescription(genMessage(totalMoney));
            } else {
                const genMessage = SlutFailMessages[getRandomInt(0, SlutFailMessages.length-1)];
                embed = new ReplyEmbed()
                    .setColor(PredefinedColors.Red)
                    .setTitle('Niestety, nie tym razem...')
                    .setDescription(genMessage(totalMoney));
            }

            return api.reply({ embeds: [embed] });
        } catch (error) {
            output.err(error);

            const embed = new ReplyEmbed()
                .setColor(PredefinedColors.Red)
                .setTitle('Błąd')
                .setDescription('Coś się złego odwaliło z tą ekonomią...')
                .setTimestamp();

            return api.reply({ embeds: [embed] });
        }
    },
};
