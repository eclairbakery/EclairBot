import { db } from "@/bot/apis/db/bot-db.js";
import { Command, CommandFlags, CommandPermissions } from "@/bot/command.js";

export const emailBlacklistCmd: Command = {
    name: 'email-blacklist',
    aliases: ['email-add-blacklisted-email'],
    description: {
        main: "Blacklistujesz e-mail i nie możesz już od niego odbierać maili (tzn. są kwalifikowane jako spam) ani wysyłać maili do tej osoby.",
        short: "Daje e-mail na blacklistę."
    },

    permissions: CommandPermissions.devOnly(),
    flags: CommandFlags.None,

    expectedArgs: [
        {
            name: 'type',
            description: "Dajesz unlock by odblokować lub lock by zablokować.",
            optional: false,
            type: 'string'
        },
        {
            name: 'email',
            description: "Ten email co chcesz zblacklistować",
            optional: false,
            type: 'string'
        }
    ],

    async execute(api) {
        const mail = api.getTypedArg('email', 'string').value!;
        const btype = api.getTypedArg('type', 'string').value!;

        let unlock = btype.trim().toLowerCase() === 'unlock';

        if (unlock) {
            await db.runSql(
                'DELETE from email_blacklist WHERE email = ?',
                [ mail.toLowerCase() ]
            );

            return api.log.replySuccess(api, 'Udało się!', 'Teraz ten e-mail **nie** jest zblacklistowany.')
        }

        await db.runSql(
            'INSERT OR IGNORE INTO email_blacklist VALUES(NULL, ?)',
            [ mail.toLowerCase() ]
        );

        return api.log.replySuccess(api, 'Yay!', 'Teraz ten e-mail jest zblacklistowany.')
    },
};
