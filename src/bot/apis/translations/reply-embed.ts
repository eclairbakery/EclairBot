import { PredefinedColors, RarelyUsedColors } from "@/util/color.js";
import { APIEmbed, APIEmbedField, APIEmbedFooter, EmbedAuthorOptions, EmbedBuilder, RestOrArray } from "discord.js";
import { t } from "./translate.js";

export class ReplyEmbed {
    private embedBuilder: EmbedBuilder = new EmbedBuilder();

    setAuthor(author: EmbedAuthorOptions) {
        this.embedBuilder.setAuthor(t(author));
        return this;
    }

    setColor(color: PredefinedColors | RarelyUsedColors | `#${number | string}`) {
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