import { CommandArgument } from "@/bot/command.js";

export function makeSlashCommandOptionDesc(arg: CommandArgument, alternativeTitle: string) {
    return (arg.description.length > 90) ?
        ((alternativeTitle.length > 90) ? (alternativeTitle.slice(0, 87) + '...') : alternativeTitle)
        : arg.description
}