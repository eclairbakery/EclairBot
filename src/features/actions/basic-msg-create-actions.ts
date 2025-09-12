import { cfg } from "@/bot/cfg.js";
import { addExperiencePoints } from "@/bot/level.js";
import { client } from "@/client.js";
import { Action, MessageEventCtx, PredefinedActionEventTypes } from "@/features/actions.js";
import { PredefinedColors } from "@/util/color.js";
import { EmbedBuilder, GuildTextBasedChannel, PermissionsBitField } from "discord.js";
import * as log from '@/util/log.js';

const WatchdogID = '267624335459270784';

export const basicMsgCreateActions: Action<MessageEventCtx> = {
    constraints: [() => true],
    activationEventType: PredefinedActionEventTypes.OnMessageCreate,
    callbacks: [
        async (msg) => {
            if (msg.inGuild()) {
                // now goes leveling
                if (!msg.author.bot) await addExperiencePoints(msg);

                if (msg.content.trim().length > 1000) {
                    return msg.reply('dobra fajnie chłopie nikt cie nie czyta nie rób dwudziestogodzinnych wideoesei na tematy które kazdy ma gdzies');
                }

                // easter egg
                if (msg.content === 'obserwuję was' && msg.author.id == WatchdogID) {
                    return msg.reply('ja cb też');
                } else if (msg.author.id == WatchdogID && (await msg.fetchReference()).author.id == client.user.id) {
                    return msg.reply('jestem istotą wyższą a jeśli to kwestionujesz lub sądzisz że wyższy jesteś to kłamiesz');
                } else if (msg.content === 'siema' && msg.author.id == WatchdogID) {
                    return msg.reply('siema watchdog, pogódźmy się\n-# (jak znowu zaczniesz mieć do mnie problemy to skończy się anti-spamem, uważaj podwładny)');
                }

                // gifs ban
                if (msg.member!.roles.cache.has(cfg.unfilteredRelated.gifBan) && msg.channelId !== cfg.unfilteredRelated.unfilteredChannel && (msg.attachments.some(att => att.name?.toLowerCase().endsWith('.gif')) || msg.content.includes('tenor.com') || msg.content.includes('.gif'))) {
                    await msg.reply('masz bana na gify');
                    await msg.delete();
                    return;
                }

                // neocity warn
                if (cfg.unfilteredRelated.makeNeocities.includes(msg.author.id) && !msg.content.startsWith(cfg.general.prefix) && Math.random() < 0.01) {
                    await msg.reply('# https://youcantsitwithus.neocities.org \n ```my own neocities page!!\nso ok let me tell you how this page came to be so i was at the hackers and designers summercamp 2024 in the netherlands litterally just vibing but i wanted to sit next to this ugly tent you know maybe make some friends but there was already melonking and linden sitting there\nimage for proof\ni cant believe this is real but as i got closer they said\nyou cant sit with us unless you have a neocities page\ncan you imagine ??\nobviously i really wanted to sit with them\ni get it "cool kid" now are on "neocities" but honestly your closer to gen z than to geocities generation so wtf???\nmaybe let people have "their own server" and leanr to "self host" instead of having to create 20 fake emails like sohyeon just to have a bunch of "poetical websites" for free????\nanyway i made my own neocities page because i don\'t let peopele talke to me like that,\nso now you can just leave me alone,,,,, right???\nor do i have to fill it with "cool gif" and LARP that it is the 90s for some reasons just to fit the vibe just asking```');
                    return;
                }

                // quote bot
                await (async function () {const regex = /https:\/\/discord\.com\/channels\/(\d+)\/(\d+)\/(\d+)/;
                    const match = msg.content.match(regex);
                    if (!match) return;
                    const [ ,, channelId, messageId ] = match;
                    const channel = await msg.client.channels.fetch(channelId);
                    if (!channel?.isTextBased()) return;

                    const perms = (channel as GuildTextBasedChannel).permissionsFor(msg.author);
                    if (
                        !perms?.has(PermissionsBitField.Flags.ViewChannel) ||
                        !perms?.has(PermissionsBitField.Flags.ReadMessageHistory)
                    ) {
                        return log.replyInfo(msg, 'Co ty odsigmiasz bratku?', 'Nie cytuj wiadomości których nawet nie możesz zobaczyć...');
                    }

                    const excludedChannels = ['1235641912241819669' /** mod gen */];
                    const strictlyExcludedChannels = [];
                    if (strictlyExcludedChannels.includes(channel.id)) {
                        return log.replyWarn(msg, 'Ten kanał jest zablokowany!', 'Jest on na liście kanałów ściśle zablokowanych');
                    } else if (excludedChannels.includes(channel.id) && !msg.content.includes('--no-block-excluded-channels')) {
                        return log.replyInfo(msg, 'Ten kanał jest zablokowany!', 'Z racji iż miły jestem czy coś i masz permisje do kanału, to możesz ponowić quote z `--no-block-excluded-channels`');
                    }

                    const quotedMsg = await channel.messages.fetch(messageId);

                    const embed = new EmbedBuilder()
                        .setAuthor({
                            name: quotedMsg.author.tag,
                            iconURL: quotedMsg.author.displayAvatarURL(),
                        })
                        .setDescription(quotedMsg.content || "*brak treści*")
                        .setTimestamp(quotedMsg.createdAt)
                        .setFooter({ text: `Wysłano w ${(channel as any)?.name ?? 'piekarnii'}` })
                        .setColor(PredefinedColors.Fuchsia);

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
                })();
            }
        },
    ]
};