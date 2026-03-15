import { Command } from "@/bot/command.ts";
import { CommandFlags } from "@/bot/apis/commands/misc.ts";
import { CommandPermissions } from "@/bot/apis/commands/permissions.ts";
import { CommandAPI } from "@/bot/apis/commands/api.ts";

export const emailDefaultTitleCmd: Command = {
    name: "email-set-default-title",
    aliases: [
        "email-default-title",
    ],
    description: {
        main: "Co tu tłumaczyć. Domyślny tytuł e-maila ustawiasz w mailach które wysyłasz przez send-email.",
        short: "Ustawiasz domyślny subject w e-mailach wysłanych przez EclairBot.",
    },
    permissions: CommandPermissions.everyone(),
    flags: CommandFlags.Important,
    expectedArgs: [
        {
            name: "title",
            optional: false,
            description: "No ten domyślny tytuł czy coś, możesz dać x jak go nie chcesz",
            type: { base: "string", trailing: true },
        },
    ],

    async execute(api) {
        const signature = api.getTypedArg("title", "string")?.value ?? "x";

        const emailApi = api.executor.email;

        if (signature.trim() === "x") {
            await emailApi.deleteDefaultTitle(api.invoker.id);
            return api.log.replySuccess(api, "Wywaliłem ci to...", "Teraz będziesz miał generyczne `brak tematu`. Gratulacje. GIFa bym wysłał ale mi się nie chce.");
        }

        await emailApi.setDefaultTitle(api.invoker.id, signature);
        return api.log.replySuccess(api, "Gotowe!", "Ustawiłem twój domyślny tytuł mail'a. To tyle w sumie.");
    },
};
