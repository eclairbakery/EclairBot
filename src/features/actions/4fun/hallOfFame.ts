import { cfg } from "@/bot/cfg.js";
import { output } from "@/bot/logging.js";
import sleep from "@/util/sleep.js";
import * as dsc from 'discord.js';
import { Action, PredefinedActionEventTypes, ReactionEventCtx } from "../index.js";

let alreadyInHallOfFame: dsc.Snowflake[] = [];

export const hallOfFameAction: Action<ReactionEventCtx> = {
    activationEventType: PredefinedActionEventTypes.OnMessageReactionAdd,
    constraints: [
        () => true
    ],
    callbacks: [
        async ({reaction}) => {
            if (reaction.partial) {
                try {
                    await reaction.fetch();
                    if (!reaction.message.inGuild()) return;
                } catch (err) {
                    output.err(err);
                    return;
                }
            }

            const msg = reaction.message;
            const count = reaction.count;
            const emoji = reaction.emoji.name;

            if ((emoji === "⭐" || emoji === "💎" || emoji === "🔥") && count === 3 && cfg.features.hallOfFame.eligibleChannels.includes(msg.channelId)) {
                if (!cfg.features.hallOfFame.enabled) {
                    const response = await reaction.message.reply('hall of fame jest wyłączony/zaarchiwizowany btw');
                    await sleep(1000);
                    response.delete();
                    return;
                }

                const channel = await msg.guild?.channels.fetch(cfg.features.hallOfFame.channel);
                if (!channel) return;
                if (!channel.isTextBased()) return;
                if (alreadyInHallOfFame.includes(msg.id)) return;
                alreadyInHallOfFame.push(msg.id);
                const embed = new dsc.EmbedBuilder()
                    .setAuthor({name: 'EclairBOT'})
                    .setColor(`#${Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, "0")}`)
                    .setTitle(`:gem: ${msg.author?.username} dostał się na Hall of Fame!`)
                    .setDescription(`Super ważna informacja, wiem. Link: https://discord.com/channels/${msg.guildId}/${msg.channelId}/${msg.id}`)
                    .setFields([
                        {
                            name: 'Wiadomość',
                            value: `${msg.content || 'brak treści'}`
                        },
                        {
                            name: 'Informacja o Hall of Fame',
                            value: 'Aby dostać się na Hall of Fame, musisz zdobyć co najmniej trzy emotki ⭐, 🔥 lub 💎. Więcej informacji [tutaj](<https://canary.discord.com/channels/1235534146722463844/1392128976574484592/1392129983714955425>).'
                        }
                    ])
                    .setFooter({ text: `Wysłano w ${(msg.channel as any)?.name ?? 'Polsce'}` });
                if (msg.attachments.size > 0) {
                    const first = msg.attachments.first();
                    if (first?.contentType?.startsWith("image/")) {
                        embed.setImage(first.url);
                    } else {
                        embed.addFields({
                            name: "Załączniki",
                            value: msg.attachments.map(a => `[${a.name}](${a.url})`).join("\n"),
                        });
                    }
                }
                channel.send({
                    embeds: [embed]
                });
            }
        }
    ]
}