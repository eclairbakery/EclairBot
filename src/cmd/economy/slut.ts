import { getRandomInt } from '@/util/math/rand.js';

import { Command, CommandFlags } from '@/bot/command.js';
import { PredefinedColors } from '@/util/color.js';
import { output } from '@/bot/logging.js';
import { formatMoney } from '@/util/math/format.js';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.js';

const CooldownMs = 2 * 60 * 1000;
const SlutAmountMin = 500;
const SlutAmountMax = 1600;
const Percentage = 0.6;

type MessageCallback = (amount: number) => string;
const SlutSuccessMessages: MessageCallback[] = [
    amount => `Pomogłeś komuś przenieść lodówkę na 4 piętro i dostałeś **${formatMoney(amount)}**. Twoje plecy już nie żyją.`,
    amount => `Wyprowadziłeś psa sąsiada i dostałeś **${formatMoney(amount)}**. Pies był bardziej profesjonalny od ciebie.`,
    amount => `Rozdawałeś ulotki pod sklepem i zarobiłeś **${formatMoney(amount)}**. 90% ludzi wyrzuciło je po 3 sekundach.`,
    amount => `Umyłeś komuś samochód na parkingu i dostałeś **${formatMoney(amount)}**.`,
    amount => `Pomogłeś komuś złożyć meble z IKEI i dostałeś **${formatMoney(amount)}**. Zostały tylko 3 śrubki.`,
    amount => `Złożyłeś komuś komputer z tutorialem z YouTube i dostałeś **${formatMoney(amount)}**.`,
    amount => `Naprawiłeś komuś WiFi restartując router i dostałeś **${formatMoney(amount)}**.`,
    amount => `Pomogłeś komuś z pracą domową i dostałeś **${formatMoney(amount)}**.`,
    amount => `Sprzedałeś stare rzeczy z piwnicy i zarobiłeś **${formatMoney(amount)}**.`,
    amount => `Zrobiłeś komuś logo w 5 minut w Paincie i dostałeś **${formatMoney(amount)}**.`,
    amount => `Zmontowałeś komuś filmik na TikToka i dostałeś **${formatMoney(amount)}**.`,
    amount => `Pomogłeś komuś przenieść kanapę i dostałeś **${formatMoney(amount)}**.`,
    amount => `Zrobiłeś komuś prezentację w PowerPoincie na ostatnią chwilę i zarobiłeś **${formatMoney(amount)}**.`,
    amount => `Znalazłeś drobne w automacie z napojami i uzbierało się **${formatMoney(amount)}**.`,
    amount => `Zagrałeś na gitarze na ulicy i ludzie wrzucili **${formatMoney(amount)}**.`,
    amount => `Pomogłeś komuś skonfigurować Discorda i dostałeś **${formatMoney(amount)}**.`,
    amount => `Sprzedałeś stare konto do gry i dostałeś **${formatMoney(amount)}**.`,
    amount => `Ktoś zapłacił ci **${formatMoney(amount)}** za zainstalowanie przeglądarki.`,
    amount => `Napisałeś komuś CV w 10 minut i dostałeś **${formatMoney(amount)}**.`,
    amount => `Zrobiłeś komuś zdjęcia na Instagrama i dostałeś **${formatMoney(amount)}**.`,
    amount => `Pomogłeś komuś ustawić telewizor i dostałeś **${formatMoney(amount)}**.`,
    amount => `Złożyłeś komuś biurko i dostałeś **${formatMoney(amount)}**.`,
    amount => `Znalazłeś stare monety w szufladzie i okazało się że są warte **${formatMoney(amount)}**.`,
    amount => `Sprzedałeś kabel którego nie używałeś od lat za **${formatMoney(amount)}**.`,
    amount => `Zrobiłeś komuś konfigurację routera i dostałeś **${formatMoney(amount)}**.`,
];
const SlutFailMessages: MessageCallback[] = [
    amount => `Próbowałeś rozdawać ulotki, ale ochroniarz wyrzucił cię po 2 minutach i dostałeś mandat na **${formatMoney(amount)}**.`,
    amount => `Chciałeś umyć komuś auto, ale porysowałeś lakier. Musiałeś zapłacić **${formatMoney(amount)}**.`,
    amount => `Pomagałeś komuś złożyć meble z IKEI, ale rozwaliłeś półkę i oddałeś **${formatMoney(amount)}** za szkody.`,
    amount => `Próbowałeś grać na ulicy, ale straż miejska kazała ci się zwinąć i zapłacić **${formatMoney(amount)}** kary.`,
    amount => `Wyprowadzałeś psa sąsiada, ale uciekł i musiałeś zapłacić **${formatMoney(amount)}** za ogłoszenia o zaginięciu.`,
    amount => `Chciałeś sprzedać stare rzeczy, ale ktoś cię oscamował i straciłeś **${formatMoney(amount)}**.`,
    amount => `Pomagałeś komuś z komputerem i przypadkiem usunąłeś mu pliki. Zapłaciłeś **${formatMoney(amount)}**.`,
    amount => `Próbowałeś zrobić komuś logo, ale klient zażądał zwrotu zaliczki **${formatMoney(amount)}**.`,
    amount => `Zgłosiłeś się do pracy dorywczej, ale okazało się że to scam i straciłeś **${formatMoney(amount)}**.`,
    amount => `Chciałeś pomóc komuś z zadaniem domowym, ale zrobiłeś je źle i oddałeś **${formatMoney(amount)}**.`,
    amount => `Próbowałeś sprzedać stare książki, ale zapłaciłeś **${formatMoney(amount)}** za wystawienie ogłoszeń które nic nie dały.`,
    amount => `Zgłosiłeś się do montowania filmiku, ale klient zniknął po tym jak zapłaciłeś **${formatMoney(amount)}** za materiały.`,
    amount => `Pomagałeś komuś przenieść kanapę i zniszczyłeś ścianę. Zapłaciłeś **${formatMoney(amount)}**.`,
    amount => `Próbowałeś sprzedać stare konto do gry, ale zostałeś oscamowany i straciłeś **${formatMoney(amount)}**.`,
    amount => `Chciałeś zrobić komuś zdjęcia, ale upuściłeś aparat i naprawa kosztowała **${formatMoney(amount)}**.`,
    amount => `Pomagałeś z internetem, ale zerwałeś kabel i musiałeś zapłacić **${formatMoney(amount)}**.`,
    amount => `Próbowałeś sprzedać lemoniadę, ale wylałeś wszystko i straciłeś **${formatMoney(amount)}** na składniki.`,
    amount => `Zgłosiłeś się do pomocy przy przeprowadzce i zbiłeś telewizor. Oddałeś **${formatMoney(amount)}**.`,
    amount => `Chciałeś złożyć komuś komputer, ale spaliłeś zasilacz i zapłaciłeś **${formatMoney(amount)}**.`,
    amount => `Próbowałeś dorobić na ulicy, ale straż miejska wlepiła ci mandat **${formatMoney(amount)}**.`,
    amount => `Chciałeś sprzedać coś na OLX, ale ktoś wyłudził od ciebie **${formatMoney(amount)}**.`,
    amount => `Próbowałeś naprawić telefon, ale ekran pękł jeszcze bardziej i oddałeś **${formatMoney(amount)}**.`,
    amount => `Pomagałeś komuś z komputerem i przypadkiem sformatowałeś dysk. Zapłaciłeś **${formatMoney(amount)}**.`,
    amount => `Próbowałeś zrobić komuś stronę internetową, ale klient zażądał zwrotu **${formatMoney(amount)}**.`,
    amount => `Zgłosiłeś się do dorywczej roboty, ale musiałeś kupić narzędzia za **${formatMoney(amount)}** i pracy i tak nie było.`,
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

            if (win) await api.executor.economy.addWalletMoney(total);
            else await api.executor.economy.deductWalletMoney(total);
            
            await api.executor.cooldowns.set('slut', Date.now());

            let embed: ReplyEmbed;
            if (win) {
                const genMessage = SlutSuccessMessages[getRandomInt(0, SlutSuccessMessages.length-1)];
                embed = new ReplyEmbed()
                    .setColor(PredefinedColors.Blue)
                    .setTitle('Sukces!')
                    .setDescription(genMessage(total));
            } else {
                const genMessage = SlutFailMessages[getRandomInt(0, SlutFailMessages.length-1)];
                embed = new ReplyEmbed()
                    .setColor(PredefinedColors.Red)
                    .setTitle('Niestety, nie tym razem...')
                    .setDescription(genMessage(total));
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
