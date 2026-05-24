import { BotCommand, EmbedBuilder, Interaction } from 'serchat.ts';
import { translate } from '@/bot/apis/translations/translate.ts';
import { db } from '@/bot/apis/db/bot-db.ts';
import { PredefinedColors } from '@/util/color.ts';
import { cfg } from '@/bot/cfg.ts';
import User from '@/bot/apis/db/user.ts';
import { mkLvlProgressBar, xpToLevel } from '@/bot/level.ts';

export default class SerchatCommandLevel extends BotCommand {
    override name: string = "lvl";
    override description: string = translate("Wyświetl swój poziom");
    override async execute(interaction: Interaction) {
        // fetch user
        const shitcord_account = await db.platforms.getDiscordAccount('serchat', interaction.senderId);
        if (!shitcord_account) {
            await interaction.reply(
                new EmbedBuilder()
                    .setTitle(translate("❌ Masz problem"))
                    .setDescription(translate(`Musisz połączyć konto SerChat z Discordem, używając komendy \`${cfg.commands.prefix}manage-accounts\` na Discordzie.`))
                    .setColor(PredefinedColors.Red)
            );
            return;
        }
        const user = new User(shitcord_account.discord_account);

        // fetch data
        const row = await user.leveling.getXP();

        // display reply 
        await interaction.reply(
            new EmbedBuilder()
                .setTitle(translate("📊 Poziom użytkownika"))
                .setDescription(translate(`**${interaction.senderUsername}** ma poziom ${xpToLevel(row, cfg.features.leveling.levelDivider)}\n${mkLvlProgressBar(row, cfg.features.leveling.levelDivider)}`))
        )
    }
}
