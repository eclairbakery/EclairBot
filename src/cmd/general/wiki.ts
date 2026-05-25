import { Command, CommandAPI } from '@/bot/command.ts';
import { CommandFlags } from '@/bot/apis/commands/misc.ts';
import { CommandPermissions } from '@/bot/apis/commands/permissions.ts';
import { PredefinedColors } from '@/util/color.ts';
import * as dsc from 'discord.js';
import getWikiArticle from '@/bot/apis/wiki/wiki.ts';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.ts';

async function replyAIModelErr(err: string, msg: dsc.Message) {
    return await msg.edit({
        embeds: [{
            author: { name: 'EclairBOT' },
            title: 'Nie udało mi się znaleźć definicji',
            description: `Aktualnie model AI ${err}, a na Wikipedii nie ma o tym artykułu.`,
            color: PredefinedColors.Red,
        }],
    });
}

const wikiCmd: Command = {
    name: 'wiki',
    aliases: [],
    description: {
        main: 'Generalnie pobiera artykuł z Wikipedii. Super użyteczne!',
        short: 'Pobiera rzecz z Wikipedii!',
    },

    flags: CommandFlags.None | CommandFlags.WorksInDM,
    permissions: CommandPermissions.everyone(),

    expectedArgs: [
        {
            name: 'query',
            type: { base: 'string', trailing: true },
            optional: false,
            description: 'No, podaj jaki jest ten twój artykuł do pobrania!',
        },
    ],

    execute: async (api: CommandAPI) => {
        const query = api.getTypedArg('query', 'string').value as string; 

        const msg = await api.log.replyTip(
            api,
            'Uzbroj się w cierpliwość',
            'Z powodu na powolność Wikipedii to może to chwilę potrwać byś dostał odpowiedź.',
        );

        const result = await getWikiArticle(query); 
        if (result.success == false) {
            return await replyAIModelErr(
                result.reason == "ai-ignore"
                    ? "świadomie postanowił Cię zlać"
                    : (result.reason == "ai-uninitialized"
                        ? "jest niezainicjalizowany"
                        : "wywalił błąd (jakiś ratelimit idk)"),
                msg
            );
        } else if (result.isDisamiguition == true) {
            return await msg.edit({
                embeds: [
                    api.log.getInfoEmbed('Doprecyzuj', `Natrafiłeś na stronę ujednoznaczniającą. W skrócie to Wikipedia nie jest pewna, czego ty szukasz, więc Ci to wyświetliła, by ci pomóc.\n\nTu masz hasła, które się mogą kryć pod Twoim zapytaniem:\n- ${result.queries.join('\n- ')}`)
                        .setURL(result.url)
                ]
            });
        } else {
            return await msg.edit({
                embeds: [
                    {
                        ...new ReplyEmbed()
                            .setColor(PredefinedColors.YellowGreen)
                            .setTitle(result.title)
                            .setDescription(result.description)
                            .setURL(result.url)
                            .setAuthor({ name: "EclairBOT" })
                            .toJSON(),
                        thumbnail: result.thumbnail
                            ? {
                                height: result.thumbnail.height, width: result.thumbnail.width, url: result.thumbnail.source
                            } 
                            : undefined,
                        footer: result.usedAi ? { text: "Ponieważ na Wikipedii nie ma artykułu o tej nazwie, ta definicja pochodzi od AI. Sprawdź ważne fakty samodzielnie." } : undefined
                    }
                ]
            });
        }
    },
};

export default wikiCmd;
