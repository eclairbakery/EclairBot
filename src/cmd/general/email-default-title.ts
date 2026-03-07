import { Command, CommandFlags, CommandPermissions } from "@/bot/command.js";

export const emailDefaultTitleCmd: Command = {
    name: 'email-set-default-title',
    aliases: [
        'email-default-title'
    ],
    description: {
        main: "Co tu tłumaczyć. Domyślny tytuł e-maila ustawiasz w mailach które wysyłasz przez send-email.",
        short: "Ustawiasz domyślny subject w e-mailach wysłanych przez EclairBot."
    },
    permissions: CommandPermissions.everyone(),
    flags: CommandFlags.Important,
    expectedArgs: [
        {
            name: 'title',
            optional: false,
            description: "No ten domyślny tytuł czy coś, możesz dać pusty jak go nie chcesz",
            type: 'trailing-string'
        }
    ],

    async execute(api) {
        const signature = api.getTypedArg('title', 'trailing-string')?.value ?? '';

        const emailApi = api.executor.email;

        if (signature.trim() === '') {
            await emailApi.deleteDefaultTitle(api.invoker.id);
            return api.log.replySuccess(api, "Wywaliłem ci to...", "Teraz będziesz miał generyczne `brak tematu`. Gratulacje. GIFa bym wysłał ale mi się nie chce.");
        }

        await emailApi.setDefaultTitle(api.invoker.id, signature);
        return api.log.replySuccess(api, "Gotowe!", "Ustawiłem twój domyślny tytuł mail'a. To tyle w sumie.");
    },
};
