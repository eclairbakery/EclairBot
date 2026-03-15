import { db } from "@/bot/apis/db/bot-db.ts";
import { Command } from "@/bot/command.ts";
import { CommandFlags } from "@/bot/apis/commands/misc.ts";
import { CommandPermissions } from "@/bot/apis/commands/permissions.ts";

export const emailBlacklistCmd: Command = {
    name: "email-blacklist",
    aliases: ["email-add-blacklisted-email"],
    description: {
        main: "Blacklistujesz e-mail i nie możesz już od niego odbierać maili (tzn. są kwalifikowane jako spam) ani wysyłać maili do tej osoby.",
        short: "Dodaje lub usuwa e-mail z blacklisty.",
    },

    permissions: CommandPermissions.devOnly(),
    flags: CommandFlags.None,

    expectedArgs: [
        {
            name: "email",
            description: "Email który chcesz zblacklistować lub odblokować.",
            optional: false,
            type: { base: "string", trailing: false },
        },
    ],

    async execute(api) {
        const mail = api.getTypedArg("email", "string").value!.toLowerCase();

        const exists = await db.selectOne(
            "SELECT 1 FROM email_blacklist WHERE email = ? LIMIT 1",
            [mail],
        );

        if (exists) {
            await db.runSql(
                "DELETE FROM email_blacklist WHERE email = ?",
                [mail],
            );

            return api.log.replySuccess(
                api,
                "Usunięto!",
                "Ten e-mail **nie jest już** na blacklistcie.",
            );
        }

        await db.runSql(
            "INSERT INTO email_blacklist VALUES (NULL, ?)",
            [mail],
        );

        return api.log.replySuccess(
            api,
            "Dodano!",
            "Ten e-mail **jest teraz** na blacklistcie.",
        );
    },
};
