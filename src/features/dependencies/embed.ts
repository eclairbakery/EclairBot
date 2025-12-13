import { APIEmbed, APIEmbedField, APIEmbedFooter, EmbedAuthorOptions, EmbedBuilder, Message, RestOrArray } from "discord.js";
import { t } from "./translate.js";

export class Embed {
    private embedBuilder: EmbedBuilder = new EmbedBuilder();

    setAuthor(author: EmbedAuthorOptions) {
        this.embedBuilder.setAuthor(t(author));
        return this;
    }

    setColor(color: number | `#${number | string}`) {
        this.embedBuilder.setColor(color);
        return this;
    }

    setDescription(desc: string) {
        this.embedBuilder.setDescription(t(desc));
        return this;
    }

    setTitle(title: string) {
        this.embedBuilder.setTitle(t(title));
        return this;
    }

    setFields(...fields: RestOrArray<APIEmbedField>) {
        this.embedBuilder.setFields(...t(fields));
        return this;
    }

    addFields(...fields: RestOrArray<APIEmbedField>) {
        this.embedBuilder.addFields(...t(fields));
        return this;
    }

    setFooter(footer: APIEmbedFooter) {
        this.embedBuilder.setFooter(t(footer));
        return this;
    }

    setImage(img: string) {
        this.embedBuilder.setImage(t(img));
        return this;
    }

    setThumbnail(img: string) {
        this.embedBuilder.setThumbnail(t(img));
        return this;
    }

    setURL(url: string) {
        this.embedBuilder.setURL(t(url));
        return this;
    }

    setTimestamp(timestamp?: Date | number | null) {
        this.embedBuilder.setTimestamp(timestamp);
        return this;
    }

    toJSON(): APIEmbed {
        return this.embedBuilder.toJSON();
    }
}

export type Replyable = Message;

export namespace log {
    export function replyWarn(msg: Replyable, title: string, desc: string) {}
    export function replyInfo(msg: Replyable, title: string, desc: string) {}
    export function replyError(msg: Replyable, title: string, desc: string) {}
    export function replySuccess(msg: Replyable, title: string, desc: string) {}
}