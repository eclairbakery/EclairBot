import { getRandomInt } from '@/util/math/rand.ts';

import { Command} from "@/bot/command.ts";
import { CommandFlags } from '@/bot/apis/commands/misc.ts';
import { PredefinedColors } from '@/util/color.ts';
import { output } from '@/bot/logging.ts';
import { cfg } from '@/bot/cfg.ts';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.ts';

import Money from '@/util/money.ts';

const CrimeAmountMin = cfg.commands.configuration.crime.minimumCrimeAmount;
const CrimeAmountMax = cfg.commands.configuration.crime.maximumCrimeAmount;
const Percentage = cfg.commands.configuration.crime.successRatio;
const Cooldown = cfg.commands.configuration.crime.cooldown;

type MessageCallback = (amount: Money) => string;
const CrimeSuccessMessages: MessageCallback[] = [
    amount => `Włamałeś się do automatu z napojami i znalazłeś w nim **${amount.format()}**.`,
    amount => `Ukradłeś komuś portfel w autobusie i znalazłeś w nim **${amount.format()}**.`,
    amount => `Podmieniłeś skarbonkę w sklepie i zgarnąłeś **${amount.format()}**.`,
    amount => `Okazało się że czyjś samochód był otwarty. W schowku znalazłeś **${amount.format()}**.`,
    amount => `Zrobiłeś fake giveaway na Discordzie i ktoś naprawdę wysłał ci **${amount.format()}**.`,
    amount => `Sprzedałeś pirackie kopie gier i zarobiłeś **${amount.format()}** zanim ktoś się zorientował.`,
    amount => `Zhakowałeś czyjeś WiFi i sprzedałeś hasło sąsiadom za **${amount.format()}**.`,
    amount => `Znalazłeś niezabezpieczoną kasę w sklepie i zgarnąłeś **${amount.format()}**.`,
    amount => `Ukryłeś cryptominera w czyimś komputerze i zarobiłeś **${amount.format()}**.`,
    amount => `Zrobiłeś phishing na Discordzie i ktoś się nabrał. Zysk **${amount.format()}**.`,
    amount => `Ukradłeś rower spod sklepu i sprzedałeś go za **${amount.format()}**.`,
    amount => `Sprzedałeś fałszywe bilety na koncert i zarobiłeś **${amount.format()}**.`,
    amount => `Podmieniłeś słoik z napiwkami w kawiarni i zgarnąłeś **${amount.format()}**.`,
    amount => `Znalazłeś niezablokowany komputer w bibliotece i przelałeś sobie **${amount.format()}**.`,
    amount => `Sprzedałeś losowy kabel jako "adapter do wszystkiego" za **${amount.format()}**.`,
    amount => `Ukradłeś hulajnogę elektryczną i sprzedałeś ją za **${amount.format()}**.`,
    amount => `Podszyłeś się pod support i ktoś wysłał ci **${amount.format()}**.`,
    amount => `Znalazłeś czyjąś zgubioną kartę podarunkową wartą **${amount.format()}**.`,
    amount => `Okazało się że ktoś zostawił portfel na ladzie. W środku było **${amount.format()}**.`,
    amount => `Sprzedałeś losowy kabel jako "adapter do wszystkiego" za **${amount.format()}**.`,
];
const CrimeFailMessages: MessageCallback[] = [
    amount => `Próbowałeś ukraść portfel, ale właściciel to zauważył i musiałeś oddać **${amount.format()}**.`,
    amount => `Chciałeś włamać się do automatu z napojami, ale przyjechała policja. Mandat **${amount.format()}**.`,
    amount => `Próbowałeś zrobić scam na Discordzie, ale ktoś zgłosił cię adminowi i straciłeś **${amount.format()}**.`,
    amount => `Ukradłeś rower, ale po 5 minutach okazało się że należy do policjanta. Strata **${amount.format()}**.`,
    amount => `Chciałeś sprzedać pirackie gry, ale klient okazał się policjantem. Kara **${amount.format()}**.`,
    amount => `Zhakowałeś WiFi sąsiada, ale zmienił hasło i musiałeś zapłacić **${amount.format()}** za szkody.`,
    amount => `Próbowałeś ukraść hulajnogę, ale bateria była rozładowana i złapali cię. Mandat **${amount.format()}**.`,
    amount => `Chciałeś zrobić phishing, ale wysłałeś linka do admina serwera. Straciłeś **${amount.format()}**.`,
    amount => `Próbowałeś okraść sklep, ale kamera wszystko nagrała. Kara **${amount.format()}**.`,
    amount => `Znalazłeś portfel, ale właściciel wrócił szybciej niż myślałeś i oddałeś **${amount.format()}**.`,
    amount => `Próbowałeś sprzedać fałszywe bilety, ale kupujący chciał zwrot **${amount.format()}**.`,
    amount => `Ukryłeś cryptominera w komputerze znajomego, ale jego antywirus znalazł go po 2 minutach. Strata **${amount.format()}**.`,
    amount => `Próbowałeś ukraść napiwki z kawiarni, ale barista cię złapał. Musiałeś oddać **${amount.format()}**.`,
    amount => `Chciałeś sprzedać kradziony rower, ale kupujący był jego właścicielem. Strata **${amount.format()}**.`,
    amount => `Podszyłeś się pod support, ale ktoś sprawdził profil i straciłeś **${amount.format()}**.`,
    amount => `Próbowałeś ukraść coś ze sklepu, ale alarm się włączył. Mandat **${amount.format()}**.`,
    amount => `Chciałeś oscamować kogoś na OLX, ale to on oscamował ciebie. Strata **${amount.format()}**.`,
    amount => `Próbowałeś włamać się do auta, ale właściciel siedział w środku. Oddałeś **${amount.format()}**.`,
    amount => `Chciałeś sprzedać fałszywy kabel jako "gamingowy", ale kupujący był informatykiem. Straciłeś **${amount.format()}**.`,
    amount => `Próbowałeś zrobić napad, ale potknąłeś się uciekając. Kara **${amount.format()}**.`,
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
        const balance = await api.executor.economy.getBalance();
        const minBalance = Money.fromDollars(100);

        if (balance.wallet.lessThanOrEqual(minBalance)) {
            const embed = new ReplyEmbed()
                .setColor(PredefinedColors.DarkBlue)
                .setTitle('Ta możliwość jest zablokowana!')
                .setDescription(`Z racji, iż mógłbyś się zadłużyć i nie móc z tego wyjść potem bez resetu ekonomii, dokonywanie przestępstw jest dozwolone tylko, jeżeli masz więcej niż ${minBalance.format()}.`);
            return api.reply({ embeds: [embed] });
        }

        try {
            const result = await api.checkCooldown('crime', Cooldown);
            if (!result.can) {
                const embed = new ReplyEmbed()
                    .setColor(PredefinedColors.Yellow)
                    .setTitle('Chwila przerwy!')
                    .setDescription(`Musisz odczekać **${result.discordTime}** zanim znowu popełnisz przestępstwo.`);
                return api.reply({ embeds: [embed] });
            }

            const baseAmount = getRandomInt(CrimeAmountMin, CrimeAmountMax);
            const win = Math.random() < Percentage;

            const multiplier = api.economy.getMultiplier('crime');
            const totalMoney = Money.fromDollarsFloat(win ? (baseAmount * multiplier) : baseAmount);

            if (win) await api.executor.economy.addWalletMoney(totalMoney);
            else await api.executor.economy.deductWalletMoney(totalMoney);

            await api.executor.cooldowns.set('crime', Date.now());

            let embed: ReplyEmbed;
            if (win) {
                const genMessage = CrimeSuccessMessages[getRandomInt(0, CrimeSuccessMessages.length-1)];
                embed = new ReplyEmbed()
                    .setColor(PredefinedColors.Blue)
                    .setTitle('Yay')
                    .setDescription(genMessage(totalMoney));
            } else {
                const genMessage = CrimeFailMessages[getRandomInt(0, CrimeFailMessages.length-1)];
                embed = new ReplyEmbed()
                    .setColor(PredefinedColors.Red)
                    .setTitle('Przestępstwo nie zawsze się opłaca...')
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
    }
};
