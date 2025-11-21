import { t } from "@/bot/apis/translations/translate.js";
import { Command, CommandArgument } from "@/bot/command.js";

export function makeSlashCommandOptionDesc(arg: CommandArgument, alternativeTitle: string) {
    return t((arg.description.length > 90) ?
        ((alternativeTitle.length > 90) ? (alternativeTitle.slice(0, 87) + '...') : alternativeTitle)
        : arg.description);
}

export function makeSlashCommandDesc(cmd: Command) {
    return t(cmd.description.main.length > 90
            ? (cmd.description.short.length > 90
                ? (cmd.description.short.slice(0, 87) + '...')
                : cmd.description.short)
            : cmd.description.main);
}