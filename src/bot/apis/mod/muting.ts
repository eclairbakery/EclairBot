import * as dsc from "discord.js";

export default function mute(
    member: dsc.GuildMember,
    data: { reason: string; duration?: number },
): Promise<dsc.GuildMember> {
    return member.timeout(data.duration ?? null, data.reason);
}
