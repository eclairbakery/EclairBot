import { BotCommand, CommandOption, EmbedBuilder, Interaction } from 'serchat.ts';
import { translate } from '@/bot/apis/translations/translate.ts';
import getWikiArticle from '@/bot/apis/wiki/wiki.ts';
import { PredefinedColors } from '@/util/color.ts';

export default class SerChatCommandWiki extends BotCommand {
    override name: string = "wiki";
    override description: string = translate("Nie wiesz co coś znaczy? Nasza encyklopedia spieszy z pomocą!");
    override options: Record<string, CommandOption> = {
        "query": {
            required: true, type: "string", 
            description: "To czego szukasz"
        }
    };
    override async execute(interaction: Interaction): Promise<void> {
        const query = interaction.getString("query")!;
        const result = await getWikiArticle(query);

        if (!result.success) {
            interaction.reply(
                new EmbedBuilder()
                    .setColor(PredefinedColors.Red)
                    .setTitle("Błąd!")
                    .setDescription(`Niestety nasze genialne wiki nie dokońca działa. Wikipedia nie ma niestety tego artykułu, a model AI wyrzucił ten błąd: \`${result.reason}\`.`)
            );
        } else if (result.isDisamiguition) {
            interaction.reply(
                new EmbedBuilder()
                    .setTitle("Doprecyzuj!")
                    .setColor(PredefinedColors.Blue)
                    .setURL(result.url)
                    .setDescription("Czyżby chodziło Ci o jedno z tych haseł?\n\n- " + result.queries.join("\n- "))
            );
        } else {
            interaction.reply(
                new EmbedBuilder()
                    .setTitle(result.title)
                    .setDescription(result.description.trim())
                    .setThumbnail(result.thumbnail ? result.thumbnail.source : null)
                    .setURL(result.url)
                    .setAuthor({ name: "EclairBOT" })
                    .setColor(PredefinedColors.YellowGreen)
                    .setFooter(result.usedAi ? {text: "Definicja od AI"} : null)
            );
        }

    }
}
