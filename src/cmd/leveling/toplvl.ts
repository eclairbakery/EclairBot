import * as dsc from "discord.js";

import { cfg } from "@/bot/cfg.ts";
import { lvlRoles } from "@/bot/level.ts";

import { Command } from "@/bot/command.ts";
import { CommandFlags } from "@/bot/apis/commands/misc.ts";
import { output } from "@/bot/logging.ts";
//import { ReplyEmbed } from "@/bot/apis/translations/reply-embed.ts";

function calculateLevel(xp: number, levelDivider: number): number {
    return Math.floor(
        (1 + Math.sqrt(1 + 8 * xp / levelDivider)) / 2,
    );
}

export const toplvlCmd: Command = {
    name: "toplvl",
    aliases: ["topka", "toplevel"],
    description: {
        main: "Czas popatrzeć na najlepszych użytkowników serwera...",
        short: "Czas popatrzeć na najlepszych użytkowników serwera...",
    },
    flags: CommandFlags.None,

    permissions: {
        allowedRoles: null,
        allowedUsers: [],
    },
    expectedArgs: [],

    async execute(api) {
        const rows = await api.executor.leveling.getEveryoneXPWithLimit(50);

        if (rows.length == 0) {
            await api.reply("Nie ma żadnego w bazie poziomu :sob:");
        }

        const fields: dsc.APIEmbedField[] = [];
        let i = 0;

        for (const row of rows) {
            if (++i > 12) break;

            try {
                const member = await api.guild?.members.fetch(row.user_id);
                if (!member) {
                    i--;
                    continue;
                }

                const userLvlRole = lvlRoles.filter((id) => member.roles.cache.has(id)).at(-1);
                fields.push({
                    name: `${i} » ${member.user.username}`,
                    value: `${userLvlRole ? `<@&${userLvlRole}>` : "Nowicjusz..."}\n**Lvl**: ${calculateLevel(row.xp, cfg.features.leveling.levelDivider)}\n**XP**: ${row.xp}${i % 2 === 1 ? "‎" : ""}`,
                    inline: true,
                });
            } catch (e) {
                output.warn(e);
                i--;
                continue;
            }
        }

        const serverXP = await api.executor.leveling.getTotalServerXP();

        await api.reply({
            components: [
                new dsc.MediaGalleryBuilder()
                    .addItems(
                        (mgi) => mgi.setDescription("toplvl image").setURL("https://cdn.discordapp.com/attachments/1404396223934369844/1404397238578577491/toplvl_image.png?ex=689b0a5a&is=6899b8da&hm=eac2a0db46bfad2dd34fa1ef8dbf9b918e46913229f7b1a9c470d952982787e8&"),
                    ),
                new dsc.SeparatorBuilder().setSpacing(dsc.SeparatorSpacingSize.Large),
                new dsc.TextDisplayBuilder()
                    .setContent("- " + fields.map((f) => `**${f.name}**: ${f.value}`).join("\n- ")),
                new dsc.SeparatorBuilder().setSpacing(dsc.SeparatorSpacingSize.Large),
                new dsc.TextDisplayBuilder()
                    .setContent(`Poziom serwera: ${calculateLevel(serverXP, cfg.features.leveling.levelDivider)} (${serverXP} XP)`),
            ],
            flags: dsc.MessageFlags.IsComponentsV2,
            allowedMentions: {
                parse: []
            }
        });
    },
};
