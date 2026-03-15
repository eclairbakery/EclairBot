import { Command } from "@/bot/command.ts";
import { CommandFlags } from "@/bot/apis/commands/misc.ts";
import { CommandPermissions } from "@/bot/apis/commands/permissions.ts";
import { CommandAPI } from "@/bot/apis/commands/api.ts";

export const emailSignatureCmd: Command = {
    name: "email-set-signature",
    aliases: [
        "email-signature",
    ],
    description: {
        main: "Ustawiasz se signature, czy tam polski podpis w e-mailu, który będziesz miał na końcu. Możesz użyć HTML.",
        short: "Ustawiasz twój podpis w e-mailach wysłanych przez EclairBot.",
    },
    permissions: CommandPermissions.everyone(),
    flags: CommandFlags.Important,
    expectedArgs: [
        {
            name: "signature",
            optional: false,
            description: "No ten podpis czy coś, możesz dać x jak go nie chcesz",
            type: { base: "string", trailing: true },
        },
    ],

    async execute(api) {
        const signature = api.getTypedArg("signature", "string")?.value ?? "x";

        const emailApi = api.executor.email;

        if (signature.trim() === "x") {
            await emailApi.deleteSignature(api.invoker.id);
            return api.log.replySuccess(api, "Wywaliłem ci to...", "Jakby coś to anonimowy nie jesteś i tak.");
        }

        await emailApi.setSignature(api.invoker.id, signature);
        return api.log.replySuccess(api, "Gotowe!", "Ustawiłem twój podpis w e-mailach.");
    },
};
