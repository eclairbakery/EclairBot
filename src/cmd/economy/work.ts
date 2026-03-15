import { getRandomInt } from '@/util/math/rand.ts';

import { PredefinedColors } from '@/util/color.ts';
import { Command} from "@/bot/command.ts";
import { CommandFlags } from '@/bot/apis/commands/misc.ts';
import { CommandPermissions } from '@/bot/apis/commands/permissions.ts';
import { CommandAPI } from '@/bot/apis/commands/api.ts';
import { output } from '@/bot/logging.ts';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.ts';

import Money from '@/util/money.ts';

const CooldownMs = 10 * 1000;
const WorkAmountMin = 50;
const WorkAmountMax = 300;

type MessageCallback = (amount: Money) => string;
const WorkMessages: MessageCallback[] = [
    amount => `Pracowałeś w serwisie komputerowym i zarobiłeś **${amount.format()}** naprawiając komuś telefon. To nic że wystarczyło wyłączyć i włączyć!`,
    amount => `Pracowałeś na kasie w macdonaldzie i zarobiłeś **${amount.format()}** serwując pyszne burgery na które cię nie stać bo dalej jesteś biedny!`,
    amount => `Pracowałeś w banku i nie dostałeś żadnego wynagrodzenia bo się opierdalałeś. Jednak nikt nie zauważył że pokryjomu ukradłeś **${amount.format()}**!`,
    amount => `Pracowałeś jako sprzątacz i zarobiłeś **${amount.format()}** za mopowanie podłogi cały dzień!`,
    amount => `Pracowałeś jako kierowca i zarobiłeś **${amount.format()}**. Oprócz spowodowania 7 wypadków drogowych szło ci całkiem dobrze!`,
    amount => `Pracowałeś jako tester gier i zarobiłeś **${amount.format()}**. Niestety gra była tak zła że to prawie kara.`,

    amount => `Sprzedałeś stary kabel którego nie używałeś od 10 lat za **${amount.format()}**. Kupujący twierdzi że to "retro technologia".`,
    amount => `Sprzedałeś kurs "Jak zostać milionerem w 7 dni" i zarobiłeś **${amount.format()}**. Sam nadal czekasz na pierwszy milion.`,
    
    amount => `Pomogłeś babci włączyć komputer. Okazało się że monitor nie był podłączony. Babcia i tak zapłaciła **${amount.format()}**.`,
    amount => `Znalazłeś **${amount.format()}** w kieszeni starych spodni. Nawet nie pamiętasz kiedy tam je włożyłeś.`,
    amount => `Pomogłeś komuś zainstalować przeglądarkę i zarobiłeś **${amount.format()}**. Informatyk 15k moment.`,
    amount => `Znalazłeś portfel na ulicy. Oddałeś dokumenty właścicielowi, ale **${amount.format()}** "na nagrodę" jakoś zostało.`,
    amount => `Sprzedałeś telewizor za **${amount.format()}** na OLX. To nic że kupiłeś go za dwa razy mniej!`,
    amount => `Znalazłeś podatność w programie bug bounty strony maciusia 1288. Zrobiłeś to dla żartu ale i tak wygrałeś **${amount.format()}**.`,
    amount => `Stworzyłeś swój niezwykle zaawansowany program do optymalizacji komputera pobierający dodatkowy RAM i sprzedałeś go za **${amount.format()}**!`,
    amount => `Sprzedałeś bratu doładowanie robux za **${amount.format()}**. To nie był zbyt uczciwy deal, ale ważne że jest zysk!`,
    amount => `Spróbowałeś kariery jako youtuber i twój film stał się viralem. Zarobiłeś z niego **${amount.format()}**, to całkiem dużo!`,
    amount => `Zrobiłeś głupi filmik z brainrotami na tiktoka i zyskałeś taką popularność że zarobiłeś **${amount.format()}**. Gdzie my zmierzamy jako ludzkość?`,
    amount => `Założyłeś się z losowym gościem o **${amount.format()+100}** że napiszesz kalkulator w assembly i wygrałeś. Niestety ${Money.fromDollarsFloat(100).format()} z tego i tak poszło na psychologa.`,
    amount => `Naprawiłeś bug który sam wcześniej wprowadziłeś i dostałeś premię **${amount.format()}**.`,
    amount => `Sprzedałeś domenę którą kupiłeś dla żartu i zarobiłeś **${amount.format()}**.`,

    amount => `Przeklikałeś ankietę w internecie i zarobiłeś **${amount.format()}**. Twoje dane osobowe już gdzieś lecą.`,
    amount => `Sprzedałeś stare konto z gry za **${amount.format()}**. 12-letni ty byłby dumny.`,
    amount => `Zrobiłeś komuś prezentację w PowerPoincie na ostatnią chwilę i zarobiłeś **${amount.format()}**.`,
    amount => `Napisałeś komuś pracę domową i zarobiłeś **${amount.format()}**. Edukacja level biznes.`,
    amount => `Znalazłeś **${amount.format()}** pod kanapą. Najwyraźniej to skarbonka przyszłości.`,
    amount => `Zainstalowałeś komuś aktualizację systemu i zarobiłeś **${amount.format()}**. Komputer teraz działa wolniej ale kto by liczył.`,
    amount => `Zrobiłeś restart routera i zarobiłeś **${amount.format()}**. Internetowy cudotwórca.`,
    amount => `Ktoś zapłacił ci **${amount.format()}** żebyś naprawił drukarkę. Po 30 minutach kupił nową.`,
    amount => `Napisałeś na StackOverflow "nvm fixed it" i ktoś wysłał ci **${amount.format()}** z wdzięczności.`,
    amount => `Zainstalowałeś komuś Linuxa i zarobiłeś **${amount.format()}**. 5 minut później poprosił żeby wrócić do Windowsa.`,
    amount => `Stworzyłeś bota na Discorda który robi absolutnie nic i zarobiłeś **${amount.format()}**.`,
    amount => `Napisałeś skrypt który robił twoją pracę za ciebie i zarobiłeś **${amount.format()}**. Automatyzacja to przyszłość.`,
    amount => `Naprawiłeś komputer który miał tylko odłączony kabel zasilania i zarobiłeś **${amount.format()}**.`,
    amount => `Sprzedałeś komuś "gamingową" myszkę z RGB i zarobiłeś **${amount.format()}**. FPS dalej ten sam.`,
    amount => `Znalazłeś stare bitcoiny na dysku i sprzedałeś część za **${amount.format()}**. Gdybyś tylko nie sprzedał w 2013...`,
    amount => `Dostałeś **${amount.format()}** za ustawienie komuś trybu ciemnego w aplikacji.`,
    amount => `Ktoś zapłacił ci **${amount.format()}** za zrobienie strony w WordPressie. Skopiowałeś template w 5 minut.`,
    amount => `Sprzedałeś kurs "Jak zarabiać w internecie" i zarobiłeś **${amount.format()}**. Ironia losu.`,
    amount => `Przekonałeś kogoś że kabel HDMI za 300zł daje lepszą jakość i zarobiłeś **${amount.format()}**.`,
    amount => `Znalazłeś **${amount.format()}** w starym portfelu. Inflacja i tak już zjadła połowę.`,
    amount => `Napisałeś 200 linijek kodu żeby uniknąć 5 minut pracy i zarobiłeś **${amount.format()}**.`,

    amount => `Naprawiłeś produkcję komentując jedną linijkę kodu i zarobiłeś **${amount.format()}**.`,
    amount => `Powiedziałeś "spróbuj wyłączyć i włączyć" i zarobiłeś **${amount.format()}**.`,
    amount => `Zdebugowałeś problem który okazał się literówką. Premia **${amount.format()}**.`,

    amount => `Czy się stoi, czy się leży, **${amount.format()}** się należy!`,
    amount => `Przespałeś cały dzień za biurkiem ale szef i tak cię pochwalił i zarobiłeś **${amount.format()}**. Chyba nie możesz narzekać.`,
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

            const baseAmount = getRandomInt(WorkAmountMin, WorkAmountMax);
            const multiplier = api.economy.getMultiplier('work');
            const totalMoney = Money.fromDollarsFloat(baseAmount * multiplier);

            await api.executor.economy.addWalletMoney(totalMoney);
            await api.executor.cooldowns.set('work', Date.now());

            const genMessage = WorkMessages[getRandomInt(0, WorkMessages.length-1)];
            const embed = new ReplyEmbed()
                .setColor(PredefinedColors.Blue)
                .setTitle('Ciężka praca popłaca! ')
                .setDescription(genMessage(totalMoney));

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
