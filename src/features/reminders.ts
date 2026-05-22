import logError from '@/util/log-error.ts';
import { client } from '@/client.ts';
import { cfg } from '@/bot/cfg.ts';
import { db } from '@/bot/apis/db/bot-db.ts';
import { GuildTextBasedChannel } from 'discord.js';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.ts';
import { PredefinedColors } from '@/util/color.ts';

export async function reminderHandler() {
    try {
        const general = await client.channels.fetch(cfg.channels.general.general) as GuildTextBasedChannel;

        for (const reminder of await db.reminders.getReminders()) {
            if (reminder.timestamp > Date.now()) continue;

            await general.send({
                embeds: [
                    new ReplyEmbed()
                        .setTitle("💡 Przypomnienie!")
                        .setDescription(
                            `Oto o czym miałeś pamiętać:\n\n` +
                            reminder.reminder
                                .split('\n')
                                .map((l) => `> ${l}`)
                                .join('\n')
                        )
                        .setColor(PredefinedColors.Gold)
                ],
                content: `<@${reminder.for_user}>`
            });
            await db.reminders.deleteReminder(reminder.id);
        }
    } catch (e) {
        logError('stdwarn', e, 'Reminder handler');
    }

    setTimeout(reminderHandler, 30 * 1000);
}
