import { GuildTextBasedChannel, PermissionsBitField } from "discord.js";
import { Action, MessageEventCtx, PredefinedActionEventTypes } from "./dependencies/actions.js";
import { Embed, log } from "./dependencies/embed.js";
import cfg from "@/bot/cfg.js";

const quoteBotAction: Action<MessageEventCtx> = {
    activationEventType: PredefinedActionEventTypes.OnMessageCreate,
    constraints: [(ctx) => true],
    callbacks: [
        async function (msg) {
            // return if bot
            if (msg.author.bot) return;
            
            // regex operations
            const regex = /https?:\/\/(?:canary\.|ptb\.)?discord(?:app)?\.com\/channels\/(\d+)\/(\d+)\/(\d+)/;
            const match = msg.content.match(regex);
            if (!match) return;

            // extract data & channel checks
            const [ ,, channelId, messageId ] = match;
            const channel = await msg.client.channels.fetch(channelId);
            if (!channel?.isTextBased()) return;
            if (channel.isDMBased()) return;

            // check if the user has perms
            const perms = (channel as GuildTextBasedChannel).permissionsFor(msg.author);
            if (
                !perms?.has(PermissionsBitField.Flags.ViewChannel) ||
                !perms?.has(PermissionsBitField.Flags.ReadMessageHistory)
            ) {
                return log.replyInfo(msg, 'Co ty odsigmiasz bratku?', 'Nie cytuj wiadomości których nawet nie możesz zobaczyć...');
            }

            // constants
            const excludedChannels = cfg.features.quoteBot.excludedChannels;
            const strictlyExcludedChannels = cfg.features.quoteBot.strictlyExcludedChannels;
            const excludedCategories = cfg.features.quoteBot.excludedCategories;

            // checks
            if (strictlyExcludedChannels.includes(channel.id)) {
                return log.replyWarn(
                    msg,
                    'Ten kanał jest zablokowany!',
                    'Jest on na liście kanałów ściśle zablokowanych, więc nie możesz z tamtąd niczego zleakować everyone... so sad, so sad...'
                );
            } 
            else if (excludedChannels.includes(channel.id) && !msg.content.includes('--no-block-excluded-channels')) {
                return log.replyInfo(
                    msg,
                    'Ten kanał jest zablokowany!',
                    'Z racji iż miły jestem czy coś i masz permisje do kanału, to możesz ponowić quote z `--no-block-excluded-channels`.'
                );
            } 
            else if (channel.parentId && excludedCategories.includes(channel.parentId) && !msg.content.includes('--no-block-excluded-channels')) {
                return log.replyInfo(
                    msg,
                    'Ten kanał jest w zablokowanej kategorii!',
                    'Z racji iż miły jestem czy coś i masz permisje do kanału, to możesz ponowić quote z `--no-block-excluded-channels`.'
                );
            }

            // get the message
            const quotedMsg = await channel.messages.fetch(messageId);

            // reply
            const embed = new Embed()
                .setAuthor({
                    name: quotedMsg.author.tag,
                    iconURL: quotedMsg.author.displayAvatarURL(),
                })
                .setDescription(quotedMsg.content || "*brak treści*")
                .setTimestamp(quotedMsg.createdAt)
                .setFooter({ text: `Wysłano w ${(channel as any)?.name ?? 'piekarnii'}` })
                .setColor(0xFF00FF);

            if (quotedMsg.attachments.size > 0) {
                const first = quotedMsg.attachments.first();
                if (first?.contentType?.startsWith("image/")) {
                    embed.setImage(first.url);
                } else {
                    embed.addFields({
                        name: "Załączniki",
                        value: quotedMsg.attachments.map(a => `[${a.name}](${a.url})`).join("\n"),
                    });
                }
            }

            await msg.reply({ embeds: [embed] });
        }
    ]
}