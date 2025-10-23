import { cfg } from "@/bot/cfg.js";
import { addExperiencePoints } from "@/bot/level.js";
import { client } from "@/client.js";
import { Action, MessageEventCtx, PredefinedActionEventTypes } from "@/features/actions.js";
import { PredefinedColors } from "@/util/color.js";
import { EmbedBuilder, GuildTextBasedChannel, PermissionsBitField, Snowflake } from "discord.js";
import * as log from '@/util/log.js';
import * as dsc from 'discord.js';
import sleep from "@/util/sleep.js";

const WatchdogID = '267624335459270784';

function shallSwitchToProgramming(msg: dsc.Message): boolean {
    const  typescript_is_better_than_c_zero_out_of_ten_ragebait = msg.content.trim().toLowerCase();
    return typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('eclairbot') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('eb-c') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('eb-rs') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('eb-ts') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('c++') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('g++') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('std') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('hyprland') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('nvim') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('neovim') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('vim') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('emacs') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('zed') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('vsc') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('visual studio code') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('visual studio') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('i tak zrobie inaczej') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('refactor') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('segfault') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('assembly') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('funkcj') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('metod') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('function') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('method') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('parser') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('lexer') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('ast') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('compiler') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('interpreter') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('oop') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('recursion') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('closure') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('lambda') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('generics') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('interface') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('trait') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('pattern') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('ref') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('pointer') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('stack') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('heap') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('python') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('javascript') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('typescript') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('nodejs') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('rust') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('golang') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('docker') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('kubernetes') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('git') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('clang') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('gcc') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('make') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('cmake') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('cmakefile') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('regex') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('deno') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('react') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('vue') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('angular') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('svelte') ||
           typescript_is_better_than_c_zero_out_of_ten_ragebait.includes('update');
}

export const basicMsgCreateActions: Action<MessageEventCtx> = {
    constraints: [() => true],
    activationEventType: PredefinedActionEventTypes.OnMessageCreate,
    callbacks: [
        async (msg) => {
            if (!msg.inGuild()) return;

            // now goes leveling
            if (!msg.author.bot) await addExperiencePoints(msg);

            // f*ck you
            if (msg.content.trim().length > 1000 && !msg.content.startsWith('```') && !msg.author.bot) {
                return msg.reply('dobra fajnie chłopie nikt cie nie czyta nie rób dwudziestogodzinnych wideoesei na tematy które kazdy ma gdzieś');
            }
            
            // easter egg
            if (msg.content === 'obserwuję was' && msg.author.id == WatchdogID) {
                return msg.reply('ja cb też');
            } else if (msg.author.id == WatchdogID && (await msg.fetchReference()).author.id == client.user!.id) {
                return msg.reply('jestem istotą wyższą a jeśli to kwestionujesz lub sądzisz że wyższy jesteś to kłamiesz');
            } else if (msg.content === 'siema' && msg.author.id == WatchdogID) {
                return msg.reply('siema watchdog, pogódźmy się\n-# (jak znowu zaczniesz mieć do mnie problemy to skończy się anti-spamem, uważaj podwładny)');
            } else if (msg.author.id == WatchdogID) {
                return msg.reply('pamiętaj że istotą niższą jesteś cn?');
            }

            // programming
            if (shallSwitchToProgramming(msg) && msg.channelId == cfg.channels.general.general && Math.random() < cfg.general.switchToProgrammingChance) {
                (async function () {
                    msg.channel.sendTyping();
                    await sleep(2000);
                    if (msg.channel.isSendable()) msg.channel.send(`## <#${cfg.channels.dev.programming}> chłopy`);
                })(); // run but not with await
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
            await (async function () {const regex = /https?:\/\/(?:canary\.|ptb\.)?discord(?:app)?\.com\/channels\/(\d+)\/(\d+)\/(\d+)/;
                const match = msg.content.match(regex);
                if (!match) return;
                const [ ,, channelId, messageId ] = match;
                const channel = await msg.client.channels.fetch(channelId);
                if (!channel?.isTextBased()) return;
                if (channel.isDMBased()) return;

                const perms = (channel as GuildTextBasedChannel).permissionsFor(msg.author);
                if (
                    !perms?.has(PermissionsBitField.Flags.ViewChannel) ||
                    !perms?.has(PermissionsBitField.Flags.ReadMessageHistory)
                ) {
                    return log.replyInfo(msg, 'Co ty odsigmiasz bratku?', 'Nie cytuj wiadomości których nawet nie możesz zobaczyć...');
                }

                const excludedChannels = ['1235641912241819669'];
                const strictlyExcludedChannels = ['1290327060970995812'];
                const excludedCategories = ['1235552673978388560', '1419322858659905566', '1407377025437798442'];

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
        },
    ]
};