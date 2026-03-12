import { getRandomInt } from '@/util/math/rand.js';

import { Command, CommandFlags } from '@/bot/command.js';
import { PredefinedColors } from '@/util/color.js';
import { output } from '@/bot/logging.js';
import { cfg } from '@/bot/cfg.js';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.js';
import { formatMoney } from '@/util/math/format.js';

const CrimeAmountMin = cfg.commands.configuration.crime.minimumCrimeAmount;
const CrimeAmountMax = cfg.commands.configuration.crime.maximumCrimeAmount;
const Percentage = cfg.commands.configuration.crime.successRatio;
const Cooldown = cfg.commands.configuration.crime.cooldown;

type MessageCallback = (amount: number) => string;
const CrimeSuccessMessages: MessageCallback[] = [
    amount => `Włamałeś się do automatu z napojami i znalazłeś w nim **${formatMoney(amount)}**.`,
    amount => `Ukradłeś komuś portfel w autobusie i znalazłeś w nim **${formatMoney(amount)}**.`,
    amount => `Podmieniłeś skarbonkę w sklepie i zgarnąłeś **${formatMoney(amount)}**.`,
    amount => `Okazało się że czyjś samochód był otwarty. W schowku znalazłeś **${formatMoney(amount)}**.`,
    amount => `Zrobiłeś fake giveaway na Discordzie i ktoś naprawdę wysłał ci **${formatMoney(amount)}**.`,
    amount => `Sprzedałeś pirackie kopie gier i zarobiłeś **${formatMoney(amount)}** zanim ktoś się zorientował.`,
    amount => `Zhakowałeś czyjeś WiFi i sprzedałeś hasło sąsiadom za **${formatMoney(amount)}**.`,
    amount => `Znalazłeś niezabezpieczoną kasę w sklepie i zgarnąłeś **${formatMoney(amount)}**.`,
    amount => `Ukryłeś cryptominera w czyimś komputerze i zarobiłeś **${formatMoney(amount)}**.`,
    amount => `Zrobiłeś phishing na Discordzie i ktoś się nabrał. Zysk **${formatMoney(amount)}**.`,
    amount => `Ukradłeś rower spod sklepu i sprzedałeś go za **${formatMoney(amount)}**.`,
    amount => `Sprzedałeś fałszywe bilety na koncert i zarobiłeś **${formatMoney(amount)}**.`,
    amount => `Podmieniłeś słoik z napiwkami w kawiarni i zgarnąłeś **${formatMoney(amount)}**.`,
    amount => `Znalazłeś niezablokowany komputer w bibliotece i przelałeś sobie **${formatMoney(amount)}**.`,
    amount => `Sprzedałeś "gamingowy" kabel który znalazłeś na ulicy za **${formatMoney(amount)}**.`,
    amount => `Ukradłeś hulajnogę elektryczną i sprzedałeś ją za **${formatMoney(amount)}**.`,
    amount => `Podszyłeś się pod support i ktoś wysłał ci **${formatMoney(amount)}**.`,
    amount => `Znalazłeś czyjąś zgubioną kartę podarunkową wartą **${formatMoney(amount)}**.`,
    amount => `Okazało się że ktoś zostawił portfel na ladzie. W środku było **${formatMoney(amount)}**.`,
    amount => `Sprzedałeś losowy kabel jako "adapter do wszystkiego" za **${formatMoney(amount)}**.`,
];
const CrimeFailMessages: MessageCallback[] = [
    amount => `Próbowałeś ukraść portfel, ale właściciel to zauważył i musiałeś oddać **${formatMoney(amount)}**.`,
    amount => `Chciałeś włamać się do automatu z napojami, ale przyjechała policja. Mandat **${formatMoney(amount)}**.`,
    amount => `Próbowałeś zrobić scam na Discordzie, ale ktoś zgłosił cię adminowi i straciłeś **${formatMoney(amount)}**.`,
    amount => `Ukradłeś rower, ale po 5 minutach okazało się że należy do policjanta. Strata **${formatMoney(amount)}**.`,
    amount => `Chciałeś sprzedać pirackie gry, ale klient okazał się policjantem. Kara **${formatMoney(amount)}**.`,
    amount => `Zhakowałeś WiFi sąsiada, ale zmienił hasło i musiałeś zapłacić **${formatMoney(amount)}** za szkody.`,
    amount => `Próbowałeś ukraść hulajnogę, ale bateria była rozładowana i złapali cię. Mandat **${formatMoney(amount)}**.`,
    amount => `Chciałeś zrobić phishing, ale wysłałeś linka do admina serwera. Straciłeś **${formatMoney(amount)}**.`,
    amount => `Próbowałeś okraść sklep, ale kamera wszystko nagrała. Kara **${formatMoney(amount)}**.`,
    amount => `Znalazłeś portfel, ale właściciel wrócił szybciej niż myślałeś i oddałeś **${formatMoney(amount)}**.`,
    amount => `Próbowałeś sprzedać fałszywe bilety, ale kupujący chciał zwrot **${formatMoney(amount)}**.`,
    amount => `Ukryłeś cryptominera w komputerze znajomego, ale jego antywirus znalazł go po 2 minutach. Strata **${formatMoney(amount)}**.`,
    amount => `Próbowałeś ukraść napiwki z kawiarni, ale barista cię złapał. Musiałeś oddać **${formatMoney(amount)}**.`,
    amount => `Chciałeś sprzedać kradziony rower, ale kupujący był jego właścicielem. Strata **${formatMoney(amount)}**.`,
    amount => `Podszyłeś się pod support, ale ktoś sprawdził profil i straciłeś **${formatMoney(amount)}**.`,
    amount => `Próbowałeś ukraść coś ze sklepu, ale alarm się włączył. Mandat **${formatMoney(amount)}**.`,
    amount => `Chciałeś oscamować kogoś na OLX, ale to on oscamował ciebie. Strata **${formatMoney(amount)}**.`,
    amount => `Próbowałeś włamać się do auta, ale właściciel siedział w środku. Oddałeś **${formatMoney(amount)}**.`,
    amount => `Chciałeś sprzedać fałszywy kabel jako "gamingowy", ale kupujący był informatykiem. Straciłeś **${formatMoney(amount)}**.`,
    amount => `Próbowałeś zrobić napad, ale potknąłeś się uciekając. Kara **${formatMoney(amount)}**.`,
];

export const crimeCmd: Command = {
    name: 'crime',
    description: {
        main: 'Ohohohoho! Mamy na serwerze przestępców. Możesz popełnić przestępstwo i wygrać albo przegrać kasę!',
        short: 'Sprawdź swoje szczęście w kryminalnym świecie.'
    },
    flags: CommandFlags.Economy,

    permissions: {
        allowedRoles: null,
        allowedUsers: null
    },
    expectedArgs: [],
    aliases: [],

    async execute(api) {
        if (((await api.executor.economy.getBalance()).wallet ?? 0) <= 100) {
            const embed = new ReplyEmbed()
                .setColor(PredefinedColors.DarkBlue)
                .setTitle('Ta możliwość jest zablokowana!')
                .setDescription(`Z racji, iż mógłbyś się zadłużyć i nie móc z tego wyjść potem bez resetu ekonomii, dokonywanie przestępstw jest dozwolone tylko, jeżeli masz więcej niż 100$.`);
            return api.reply({ embeds: [embed] });
        }

        try {
            const result = await api.checkCooldown('crime', Cooldown);
            if (!result.can) {
                const embed = new ReplyEmbed()
                    .setColor(PredefinedColors.Yellow)
                    .setTitle('Chwila przerwy!')
                    .setDescription(`Musisz odczekać **<seconds> sekund** zanim znowu popełnisz przestępstwo.`.replaceAll('<seconds>', result.discordTime));
                return api.reply({ embeds: [embed] });
            }

            const amount = getRandomInt(CrimeAmountMin, CrimeAmountMax);
            const win = Math.random() < Percentage;

            const multiplier = api.economy.getMultiplier('crime');
            const total = win ? (amount * multiplier) : amount;

            if (win) await api.executor.economy.addWalletMoney(total);
            else await api.executor.economy.deductWalletMoney(total);

            await api.executor.cooldowns.set('crime', Date.now());

            let embed: ReplyEmbed;
            if (win) {
                const genMessage = CrimeSuccessMessages[getRandomInt(0, CrimeSuccessMessages.length-1)];
                embed = new ReplyEmbed()
                    .setColor(PredefinedColors.Blue)
                    .setTitle('Yay')
                    .setDescription(genMessage(total));
            } else {
                const genMessage = CrimeFailMessages[getRandomInt(0, CrimeFailMessages.length-1)];
                embed = new ReplyEmbed()
                    .setColor(PredefinedColors.Red)
                    .setTitle('Przestępstwo nie zawsze się opłaca...')
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
    }
};
