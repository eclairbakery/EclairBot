import * as dsc from 'discord.js';

import { Command} from "@/bot/command.js";
import { CommandFlags } from '@/bot/apis/commands/misc.js';
import { output } from '@/bot/logging.js';
import { getUserReputation, Reputation } from '@/bot/apis/rep/rep.js';
import { mkDualProgressBar, mkProgressBar } from '@/util/progressbar.js';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.js';

function getReputationDescription(user: dsc.GuildMember, reputation: Reputation): string {
    let firstSentence: string = '', secondSentence: string = '', thirdSentence: string = '';

    const { repProportion } = reputation;
    if (repProportion.plus < 2) {
        firstSentence = `<@${user.id}> nie posiada zbyt wielu dobrych opini.`;

        if (repProportion.sub < 2) {
            secondSentence = `Złych opini również nie posiada... Wygląda na to że poprostu nie został jeszcze oceniany.`
        } else if (repProportion.sub >= 2 && repProportion.sub <= 3) {
            secondSentence = `Ale za to posiada całkiem dużo złych! Chyba użytkownicy go nie lubią...`;
        } else if (repProportion.sub >= 4) {
            secondSentence = `Ale za to posiada mase złych! Są 2 opcje: albo ktoś go bardzo nie lubi, albo poprostu jest cwelem!`;
        }
    } else if (repProportion.plus >= 2 && repProportion.plus <= 3) {
        firstSentence = `<@${user.id}> ma całkiem dużo dobrych opini!`;

        if (repProportion.sub < 2) {
            secondSentence = `Złych opini za to nie ma. Wygląda na całkiem miłego użytkownika!`
        } else if (repProportion.sub >= 2 && repProportion.sub <= 3) {
            secondSentence = `Podobną ilość ma też złych opini. Ten użytkownik wydaje się dość kontrowersyjny`;
        } else if (repProportion.sub >= 4) {
            secondSentence = `Ale jeszcze więcej ma tych złych! Hmmm... mam wrażenie że albo przekupił osoby wystawiające mu te dobre opinie albo to jego alty 💀.`;
        }
    } else if (repProportion.plus >= 4) {
        firstSentence = `<@${user.id}> ma mase chwalących go opini!`;

        if (repProportion.sub < 2) {
            secondSentence = `Złych opini za to nie ma. Wygląda na bardzo dobrego użytkownika!`
        } else if (repProportion.sub >= 2 && repProportion.sub <= 3) {
            secondSentence = `Ma też troche gorszych opini, ale dalej te dobre przewyższają!`;
        } else if (repProportion.sub >= 4) {
            secondSentence = `Podobną ilość ma też opini złych... Ten użytkownik wydaje się bardzo kontrowersyjny!`;
        }
    }

    const { repScale } = reputation;
    if (repScale < 4) {
        thirdSentence = `Niestety przez to jest on bardzo nisko w rankingu reputacji.`;
    } else if (repScale >= 4 && repScale <= 7) {
        thirdSentence = `To klasywikuje go na całkiem dobrej pozycji w rankingu reputacji!`;
    } else if (repScale >= 8) {
        thirdSentence = `Dzięki temu jest on bardzo wysoko w rankingu reputacji!`;
    }

    return `${firstSentence} ${secondSentence}\n${thirdSentence}`;
}

export const reputationCmd: Command = {
    name: 'reputation',
    aliases: ['rep'],
    description: {
        main: 'To polecenie wyświetla ci reputacje danego użytkownika oraz kilka najnowszych opinii!',
        short: 'Wyświetla reputacje użytkownika',
    },
    flags: CommandFlags.None,

    expectedArgs: [
        {
            name: 'user',
            description: 'Użytkownik którego reputacje chcesz sprawdzić',
            type: { base: 'user-mention', includeRefMessageAuthor: true },
            optional: false,
        },
    ],
    permissions: {
        allowedRoles: null,
        allowedUsers: null,
    },

    async execute(api) {
        const user = api.getTypedArg('user', 'user-mention').value as dsc.GuildMember;

        const userReputation = await getUserReputation(user.user.id);
        output.log(userReputation);
        const embed = new ReplyEmbed()
            .setAuthor({ name: user.nickname ?? user.user.username, iconURL: user.displayAvatarURL({ size: 128 }) })
            .setTitle(`Reputacja użytkownika ${user.displayName}`)
            .setDescription(getReputationDescription(user, userReputation))
            .addFields(
                {
                    name: 'Reputacja',
                    value: mkDualProgressBar(userReputation.repProportion.sub, userReputation.repProportion.plus),
                    inline: false,
                },
                {
                    name: 'Ranking',
                    value: mkProgressBar(userReputation.repScale, 10),
                    inline: false,
                },
            );

        return api.reply({ embeds: [embed] });
    },
};
