import * as dsc from 'discord.js';

export function getErrorEmbed(error: string, desc: string) {
    return {
        embeds: [
            new dsc.EmbedBuilder()
                    .setTitle('⚠️ ' + error)
                    .setColor(0xff0000)
                    .setAuthor({ name: 'EclairBOT' })
                    .setDescription(desc)
        ]
    };
}

export function replyError(msg: dsc.OmitPartialGroupDMChannel<dsc.Message<boolean>>, error: string, desc: string) {
    msg.reply(getErrorEmbed(error, desc));
}