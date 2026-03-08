import { getRandomInt } from '@/util/math/rand.js';

import { PredefinedColors } from '@/util/color.js';
import { Command, CommandAPI, CommandFlags } from '@/bot/command.js';
import { output } from '@/bot/logging.js';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.js';
import { formatMoney } from '@/util/math/format.js';

const CooldownMs = 10 * 1000;
const WorkAmountMin = 50;
const WorkAmountMax = 300;

type MessageCallback = (amount: number) => string;
const WorkMessages: MessageCallback[] = [
    amount => `Pracowałeś w serwisie komputerowym i zarobiłeś **${formatMoney(amount)}** naprawiając komuś telefon. To nic że wystarczyło wyłączyć i włączyć!`,
    amount => `Pracowałeś na kasie w macdonaldzie i zarobiłeś **${formatMoney(amount)}** serwując pyszne burgery na które cię nie stać bo dalej jesteś biedny!`,
    amount => `Pracowałeś w banku i nie dostałeś żadnego wynagrodzenia bo się opierdalałeś. Jednak nikt nie zauważył że pokryjomu ukradłeś **${formatMoney(amount)}**!`,
    amount => `Pracowałeś jako sprzątacz i zarobiłeś **${formatMoney(amount)}** za mopowanie podłogi cały dzień!`,
    amount => `Pracowałeś jako kierowca i zarobiłeś **${formatMoney(amount)}**. Oprócz spowodowania 7 wypadków drogowych szło ci całkiem dobrze!`,
    amount => `Pracowałeś jako tester gier i zarobiłeś **${formatMoney(amount)}**. Niestety gra była tak zła że to prawie kara.`,

    amount => `Sprzedałeś stary kabel którego nie używałeś od 10 lat za **${formatMoney(amount)}**. Kupujący twierdzi że to "retro technologia".`,
    amount => `Sprzedałeś kurs "Jak zostać milionerem w 7 dni" i zarobiłeś **${formatMoney(amount)}**. Sam nadal czekasz na pierwszy milion.`,
    
    amount => `Pomogłeś babci włączyć komputer. Okazało się że monitor nie był podłączony. Babcia i tak zapłaciła **${formatMoney(amount)}**.`,
    amount => `Znalazłeś **${formatMoney(amount)}** w kieszeni starych spodni. Nawet nie pamiętasz kiedy tam je włożyłeś.`,
    amount => `Pomogłeś komuś zainstalować przeglądarkę i zarobiłeś **${formatMoney(amount)}**. Informatyk 15k moment.`,
    amount => `Znalazłeś portfel na ulicy. Oddałeś dokumenty właścicielowi, ale **${formatMoney(amount)}** "na nagrodę" jakoś zostało.`,
    amount => `Sprzedałeś telewizor za **${formatMoney(amount)}** na OLX. To nic że kupiłeś go za dwa razy mniej!`,
    amount => `Znalazłeś podatność w programie bug bounty strony maciusia 1288. Zrobiłeś to dla żartu ale i tak wygrałeś **${formatMoney(amount)}**.`,
    amount => `Stworzyłeś swój niezwykle zaawansowany program do optymalizacji komputera pobierający dodatkowy RAM i sprzedałeś go za **${formatMoney(amount)}**!`,
    amount => `Sprzedałeś bratu doładowanie robux za **${formatMoney(amount)}**. To nie był zbyt uczciwy deal, ale ważne że jest zysk!`,
    amount => `Spróbowałeś kariery jako youtuber i twój film stał się viralem. Zarobiłeś z niego **${formatMoney(amount)}**, to całkiem dużo!`,
    amount => `Zrobiłeś głupi filmik z brainrotami na tiktoka i zyskałeś taką popularność że zarobiłeś **${formatMoney(amount)}**. Gdzie my zmierzamy jako ludzkość?`,
    amount => `Założyłeś się z losowym gościem o **${formatMoney(amount)+100}** że napiszesz kalkulator w assembly i wygrałeś. Niestety ${formatMoney(100)} z tego i tak poszło na psychologa.`,
    amount => `Naprawiłeś bug który sam wcześniej wprowadziłeś i dostałeś premię **${formatMoney(amount)}**.`,
    amount => `Sprzedałeś domenę którą kupiłeś dla żartu i zarobiłeś **${formatMoney(amount)}**.`,

    amount => `Przeklikałeś ankietę w internecie i zarobiłeś **${formatMoney(amount)}**. Twoje dane osobowe już gdzieś lecą.`,
    amount => `Sprzedałeś stare konto z gry za **${formatMoney(amount)}**. 12-letni ty byłby dumny.`,
    amount => `Zrobiłeś komuś prezentację w PowerPoincie na ostatnią chwilę i zarobiłeś **${formatMoney(amount)}**.`,
    amount => `Napisałeś komuś pracę domową i zarobiłeś **${formatMoney(amount)}**. Edukacja level biznes.`,
    amount => `Znalazłeś **${formatMoney(amount)}** pod kanapą. Najwyraźniej to skarbonka przyszłości.`,
    amount => `Zainstalowałeś komuś aktualizację systemu i zarobiłeś **${formatMoney(amount)}**. Komputer teraz działa wolniej ale kto by liczył.`,
    amount => `Zrobiłeś restart routera i zarobiłeś **${formatMoney(amount)}**. Internetowy cudotwórca.`,
    amount => `Ktoś zapłacił ci **${formatMoney(amount)}** żebyś naprawił drukarkę. Po 30 minutach kupił nową.`,
    amount => `Napisałeś na StackOverflow "nvm fixed it" i ktoś wysłał ci **${formatMoney(amount)}** z wdzięczności.`,
    amount => `Zainstalowałeś komuś Linuxa i zarobiłeś **${formatMoney(amount)}**. 5 minut później poprosił żeby wrócić do Windowsa.`,
    amount => `Stworzyłeś bota na Discorda który robi absolutnie nic i zarobiłeś **${formatMoney(amount)}**.`,

    amount => `Naprawiłeś produkcję komentując jedną linijkę kodu i zarobiłeś **${formatMoney(amount)}**.`,
    amount => `Powiedziałeś "spróbuj wyłączyć i włączyć" i zarobiłeś **${formatMoney(amount)}**.`,
    amount => `Zdebugowałeś problem który okazał się literówką. Premia **${formatMoney(amount)}**.`,

    amount => `Czy się stoi, czy się leży, **${formatMoney(amount)}** się należy!`,
    amount => `Przespałeś cały dzień za biurkiem ale szef i tak cię pochwalił i zarobiłeś **${formatMoney(amount)}**. Chyba nie możesz narzekać.`,
];

export const workCmd: Command = {
    name: 'work',
    aliases: [],
    description: {
        main: 'Pr\\*ca dla pana, pr\\*ca za darmo! Niewolnikiem naszym bądź... dobra, nie mam talentu do wierszy. Po prostu ekonomia.',
        short: 'Pr\\*ca dla pana, pr\\*ca za darmo!',
    },
    flags: CommandFlags.Economy,

    permissions: {
        allowedRoles: null,
        allowedUsers: null,
    },
    expectedArgs: [],

    async execute(api: CommandAPI) {
        try {
            const result = await api.checkCooldown('work', CooldownMs);
            if (!result.can) {
                const embed = new ReplyEmbed()
                    .setColor(PredefinedColors.Yellow)
                    .setTitle('Chwila przerwy!')
                    .setDescription(`Ktoś tam Ci każe czekać ${result.discordTime} sekund zanim znowu popr*cujesz, żebyś nie naspamił komendami w chuja hajsu...`);

                return api.reply({ embeds: [embed] });
            }

            const amount = getRandomInt(WorkAmountMin, WorkAmountMax);
            const multiplier = api.economy.getMultiplier('work');
            const total = amount * multiplier;

            await api.executor.economy.addWalletMoney(total);
            await api.executor.cooldowns.set('work', Date.now());

            const genMessage = WorkMessages[getRandomInt(0, WorkMessages.length-1)];
            const embed = new ReplyEmbed()
                .setColor(PredefinedColors.Blue)
                .setTitle('Ciężka praca popłaca!')
                .setDescription(genMessage(amount));

            return api.reply({ embeds: [embed] });
        } catch (err) {
            output.err(err);
            
            const embed = new ReplyEmbed()
                .setColor(PredefinedColors.Red)
                .setTitle('Błąd')
                .setDescription('Coś się złego odwaliło z tą ekonomią...')
                .setTimestamp();

            return api.reply({ embeds: [embed] });
        }
    }
};
