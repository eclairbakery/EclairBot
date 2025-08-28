import { Command, Category } from '../../bot/command.js';
import { PredefinedColors } from '../../util/color.js';
import { cfg } from '../../bot/cfg.js';
import { db, sqlite } from '../../bot/db.js';

import * as log from '../../util/log.js';
import * as dsc from 'discord.js';

import findCommand from '../../util/findCommand.js';

function extractFirstParagraph(wikitext: string): string {
    wikitext = wikitext.replace(/\{\{[^}]+\}\}/g, '').replace(/<mainpage-[^>]+\/>/g, '').replace(/<div[^>]*>/g, '').replace(/<\/div>/g, '').replace(/\[([^\s\]]+) ([^\]]+)\]/g, '$2').replace(/<ref[^>]*>.*?<\/ref>/gis, "").replace(/==[^=]+==/g, '');
    wikitext = wikitext.replace(/'''+/g, '').replace(/''/g, '');
    wikitext = wikitext.replace(/\[\[(Kategoria|Plik):[^\]]+\]\]/gi, '').replace(/<[^>]+>/g, "");
    wikitext = wikitext.replace(/^\*+/gm, '').trim();
    const paragraphs = wikitext.split(/\n{2,}/);
    return paragraphs[0] || '';
}

async function getFandomSummary(title: string) {
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
    if (page.missing || page.missing == '') return false;

    var desc = extractFirstParagraph(page.revisions[0].slots.main['*']);
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
    longDesc: 'Generalnie pobiera artykuł z Fandomu. Super użyteczne!',
    shortDesc: 'Pobiera rzecz z Fandomu!',
    expectedArgs: [],
    aliases: [],
    allowedRoles: null,
    allowedUsers: [],
    async execute(msg, args) {
        if (args.length == 0) args.push('Wikipedia');
        const fandom = await getFandomSummary(args.join('_'));
        if (fandom) {
            return msg.reply({
                embeds: [
                    {
                        author: { name: 'EclairBOT' },
                        title: fandom.title,
                        description: fandom.extract,
                        url: fandom.url,
                        color: PredefinedColors.Magenta,
                        thumbnail: fandom.thumbnail
                    }
                ]
            });
        }
        return msg.reply({
            embeds: [
                {
                    author: {
                        name: 'EclairBOT'
                    },
                    title: 'Nie znalazłem',
                    color: PredefinedColors.Orange,
                    description: 'Takiego artykułu nie ma!'
                }
            ]
        });
    },
};