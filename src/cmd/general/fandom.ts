import { cfg } from '@/bot/cfg.js';
import { Command, CommandAPI, CommandFlags } from '@/bot/command.js';
import { PredefinedColors } from '@/util/color.js';
import * as log from '@/util/log.js';
import * as dsc from 'discord.js';

async function getFandomSummary(title: string) {
    function extractFirstParagraph(wikitext: string): string {
        wikitext = wikitext.replace(/\{\{[^}]+\}\}/g, '')
            .replace(/<mainpage-[^>]+\/>/g, '')
            .replace(/<div[^>]*>/g, '')
            .replace(/<\/div>/g, '')
            .replace(/\[([^\s\]]+) ([^\]]+)\]/g, '$2')
            .replace(/<ref[^>]*>.*?<\/ref>/gis, "")
            .replace(/==[^=]+==/g, '')
            .replace(/'''+/g, '')
            .replace(/''/g, '')
            .replace(/\[\[(Kategoria|Plik):[^\]]+\]\]/gi, '')
            .replace(/<[^>]+>/g, "")
            .replace(/^\*+/gm, '')
            .trim();

        const paragraphs = wikitext.split(/\n{2,}/);
        return paragraphs[0] || '';
    }

    const searchUrl = `https://eklerka25.fandom.com/pl/api.php?action=query&list=search&srsearch=${encodeURIComponent(title)}&format=json`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json() as any;
    const firstResult = searchData.query?.search?.[0];
    if (!firstResult) return false;

    const exactTitle = firstResult.title;
    const pageUrl = `https://eklerka25.fandom.com/pl/api.php?action=query&rvslots=*&titles=${exactTitle}&prop=pageimages|revisions&rvprop=content&format=json&pithumbsize=250`;
    const res = await fetch(pageUrl);
    const data = await res.json() as any;
    const page = Object.values(data.query.pages)[0] as any;
    if (page.missing || page.missing === '') return false;

    let desc = extractFirstParagraph(page.revisions[0].slots.main['*']);
    if (desc.startsWith(`${exactTitle}\n`)) desc = desc.replace(`${exactTitle}\n`, '');

    return {
        title: page.title,
        extract: desc,
        url: `https://eklerka25.fandom.com/pl/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
        thumbnail: page.thumbnail?.source ? {
            url: page.thumbnail.source,
            width: page.thumbnail.width,
            height: page.thumbnail.height
        } : undefined
    };
}

export const fandomCmd: Command = {
    name: 'fandom',
    description: {
        main: 'Generalnie pobiera artykuł z Fandomu. Super użyteczne!',
        short: 'Pobiera rzecz z Fandomu!'
    },
    flags: CommandFlags.None | CommandFlags.WorksInDM,

    permissions: {
        discordPerms: null,
        allowedRoles: null,
        allowedUsers: []
    },
    expectedArgs: [
        {
            name: 'query',
            type: 'trailing-string',
            optional: true,
            description: 'Fraza do wyszukania na Fandomie'
        }
    ],
    aliases: [],
    execute: async (api: CommandAPI) => {
        const queryArg = api.getTypedArg('query', 'trailing-string');
        const searchQuery = queryArg.value as string || cfg.customization.uncategorized.fandomDefaultQueryText;
        const fandom = await getFandomSummary(searchQuery.replace(/ /g, '_'));

        const msg = api.msg;

        if (fandom) {
            return msg.reply({
                embeds: [
                    new dsc.EmbedBuilder()
                        .setAuthor({ name: 'EclairBOT' })
                        .setTitle(fandom.title)
                        .setDescription(fandom.extract)
                        .setURL(fandom.url)
                        .setColor(PredefinedColors.Magenta)
                        .setThumbnail(fandom.thumbnail?.url || null)
                ]
            });
        }

        return msg.reply({
            embeds: [
                new dsc.EmbedBuilder()
                    .setAuthor({ name: 'EclairBOT' })
                    .setTitle(cfg.customization.uncategorized.fandomArticleNotFoundHeader)
                    .setDescription(cfg.customization.uncategorized.fandomArticleNotFoundText)
                    .setColor(PredefinedColors.Orange)
            ]
        });
    }
};
