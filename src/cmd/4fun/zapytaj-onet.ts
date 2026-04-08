// deno-lint-ignore no-import-prefix
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.56/deno-dom-wasm.ts";

import { Command } from '@/bot/command.ts';
import { CommandFlags } from '@/bot/apis/commands/misc.ts';
import { CommandPermissions } from '@/bot/apis/commands/permissions.ts';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.ts';
import { PredefinedColors } from '@/util/color.ts';

async function fetchPosts() {
    const res = await fetch('https://zapytaj.onet.pl/Question,0.html');
    const html = await res.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const items = [...doc.querySelectorAll('ul.item-list li article')];

    return items.map(el => {
        const link = el.querySelector('.item-cont h3 a');
        return {
            name: link?.textContent?.trim() || 'Brak tytułu',
            url: "https://zapytaj.onet.pl" + (link?.getAttribute('href') || '')
        };
    });
}

async function fetchPostDetails(url: string) {
    const res = await fetch(url);
    const html = await res.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const fullPost = doc.querySelector('section.question-details p.question-content')?.textContent?.trim() || '';

    const iframe = doc.querySelector<HTMLIFrameElement>('section.question-details iframe')?.getAttribute('src') ?? undefined;

    const replies = [...doc.querySelectorAll('section.question-other-answers article')].map(el => ({
        content: el.querySelector('div.question-content')?.textContent?.trim() || '',
        upvotes: Number(el.querySelector('.vote-up a.ocenaPlus')?.textContent) || 0,
        downvotes: Number(el.querySelector('.vote-down a.ocenaMinus')?.textContent) || 0
    }));

    return { fullPost, replies, iframe };
}

// deno-lint-ignore no-explicit-any
function getBestReply(post: { fullPost: string; replies: any[] }) {
    return post.replies
        .map(r => ({
            ...r,
            points: (r.upvotes) - (r.downvotes) + Math.floor(r.content.length / 50) * 5
        }))
        .sort((a, b) => b.points - a.points)[0];
}

export const zapytajOnetCmd: Command = {
    name: "zapytaj-onet",
    aliases: ["onet-zapytaj"],
    description: {
        main: "Zaawansowana technologia (z 2015). Zaawansowane forum. Zaawansowane odpowiedzi. Integracja z Zapytaj Onet!",
        short: "W skrócie to taki tool do Zapytaj Onet"
    },

    flags: CommandFlags.None,
    permissions: CommandPermissions.everyone(),
    expectedArgs: [],

    async execute(api) {
        const msg = await api.log.replyTip(api, 'Zaczekaj chwilkę', 'Generalnie to jest taki web-scraping i to mi chwilę zajmie, więc zaczekaj cierpliwie ładnie proszę.');

        const posts = await fetchPosts();

        let page = 0;
        const perPage = 5;

        function getPage() {
            return posts.slice(page * perPage, (page + 1) * perPage);
        }

        function buildHome() {
            const current = getPage();

            const embed = new ReplyEmbed()
                .setTitle('📚 Zapytaj Onet')
                .setColor(PredefinedColors.YellowGreen)
                .setDescription(
                    [
                        "Oto najnowsze pytania na tym pinknym serwisie:",
                        "",
                        ...current.map((p, i) => `- [**${i + 1}**] ${p.name}`)
                    ].join('\n')
                );

            const rows: ActionRowBuilder<ButtonBuilder>[] = [];

            let row = new ActionRowBuilder<ButtonBuilder>();

            current.forEach((_, i) => {
                if (row.components.length === 5) {
                    rows.push(row);
                    row = new ActionRowBuilder<ButtonBuilder>();
                }

                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`post_${page}_${i}`)
                        .setLabel(`${i + 1}`)
                        .setStyle(ButtonStyle.Primary)
                );
            });

            if (row.components.length) rows.push(row);

            const nav = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId('prev')
                    .setLabel('<')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page === 0),
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('>')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled((page + 1) * perPage >= posts.length)
            );

            rows.push(nav);

            return { embed, rows };
        }

        const { embed, rows } = buildHome();

        await msg.edit({ embeds: [embed], components: rows });

        const collector = msg.createMessageComponentCollector({ time: 600000 });

        collector.on('collect', async (i) => {
            if (i.customId === 'prev') {
                page--;
                const { embed, rows } = buildHome();
                return i.update({ embeds: [embed], components: rows });
            }

            if (i.customId === 'next') {
                page++;
                const { embed, rows } = buildHome();
                return i.update({ embeds: [embed], components: rows });
            }

            if (i.customId.startsWith('post_')) {
                const [, p, idx] = i.customId.split('_');
                const postMeta = posts[Number(p) * perPage + Number(idx)];

                const data = await fetchPostDetails(postMeta.url);
                const best = getBestReply(data);

                const postEmbed = new ReplyEmbed()
                    .setTitle("📜 " + postMeta.name)
                    .setDescription(
                        data.fullPost || "*Ten user był zbyt leniwy by opis dodać.*" +
                        (
                            data.iframe != null && data.iframe != undefined
                                ? `\n\n**Ramkę do strony dał:** ${data.iframe}`
                                : ""
                        )
                    )
                    .setColor(PredefinedColors.Aqua);

                const answerEmbed = best?.content 
                    ? new ReplyEmbed()
                        .setTitle('Najlepsza odpowiedź')
                        .setDescription(`${best.content}`)
                        .setColor(PredefinedColors.Green)
                        .setFooter({ text: `Ta odpowiedź uzyskała ${best.points || 0} pkt, ${best.upvotes || 0} upvote i ${best.downvotes || 0} downvote.` })
                    : new ReplyEmbed()
                        .setTitle('Odpowiedzi nie ma')
                        .setDescription('Te zapytanie czy tam pytanie obecnie nie ma odpowiedzi. Możesz ją dodać. Istnieje też szansa, że to ankieta, której jeszcze nie wspieramy.')
                        .setColor(PredefinedColors.Red);

                const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder()
                        .setCustomId('back')
                        .setLabel('Wróć')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setLabel('Wyświetl w Zapytaj Onet')
                        .setStyle(ButtonStyle.Link)
                        .setURL(postMeta.url)
                );

                return i.update({ embeds: [postEmbed, answerEmbed], components: [row] });
            }

            if (i.customId === 'back') {
                const { embed, rows } = buildHome();
                return i.update({ embeds: [embed], components: rows });
            }
        });
    }
};
