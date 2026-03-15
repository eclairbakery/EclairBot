import * as dsc from "discord.js";
import { Command } from "@/bot/command.ts";
import { CommandFlags } from "@/bot/apis/commands/misc.ts";

import { PredefinedColors } from "@/util/color.ts";
import { ReplyEmbed } from "@/bot/apis/translations/reply-embed.ts";
import User from "@/bot/apis/db/user.ts";

const DefaultLimit = 10;

export const replistCmd: Command = {
    name: "replist",
    aliases: ["list-reps", "repslist", "rep-list"],
    description: {
        main: "Pokazuje liste wystawionych opini o danym użytkowniku",
        short: "Wyświetla opinie użytkownika",
    },
    flags: CommandFlags.None,

    expectedArgs: [
        {
            name: "user",
            description: "Użytkownik którego repów chcesz dostać liste",
            type: { base: "user-mention", includeRefMessageAuthor: true },
            optional: false,
        },
        {
            name: "limit",
            description: `Limit ile maksymalnie repów chcesz zobaczyć. Domyślnie ${DefaultLimit}`,
            type: { base: "float" },
            optional: true,
        },
    ],
    permissions: {
        allowedUsers: null,
        allowedRoles: null,
    },

    async execute(api) {
        const user = api.getTypedArg("user", "user-mention").value as dsc.GuildMember;
        const limit = api.getTypedArg("limit", "float").value ?? DefaultLimit;

        const userReps = await new User(user.id).reputation.getReceived();

        const fields: dsc.APIEmbedField[] = [];
        let i = 1;

        for (const rep of userReps) {
            if (i > limit) break;

            const author = await api.guild?.members.fetch(rep.authorId);
            if (author == null) continue;

            fields.push({
                name: `${rep.type == "+rep" ? "🟢" : "🔴"} ${rep.type} od ${author.user.displayName}`,
                value: rep.comment ?? "*Brak komentarza*",
                inline: false,
            });

            ++i;
        }
        if (userReps.length - i + 1 > 0) {
            fields.push({
                name: `I jeszcze ${userReps.length + 1 - i}...`,
                value: "",
                inline: false,
            });
        }

        return api.reply({
            embeds: [
                new ReplyEmbed()
                    .setTitle(`Lista opini użytkownika ${api.invoker.member?.displayName ?? api.invoker.user.username}`)
                    .setDescription("No ten, tu masz liste:")
                    .setFields(fields)
                    .setColor(PredefinedColors.Cyan),
            ],
        });
    },
};
