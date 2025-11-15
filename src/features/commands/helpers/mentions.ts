import * as dsc from 'discord.js';

export function parseMentionsFromStrings(args: string[], guild: dsc.Guild) {
    const users = new dsc.Collection<string, dsc.User>();
    const roles = new dsc.Collection<string, dsc.Role>();
    const members = new dsc.Collection<string, dsc.GuildMember>();
    const channels = new dsc.Collection<string, dsc.GuildChannel>();
    const userRegex = /^<@!?(\d+)>$/;
    const roleRegex = /^<@&(\d+)>$/;
    const channelRegex = /^<#(\d+)>$/;
    for (const arg of args) {
        let match: RegExpExecArray | null = null;
        if ((match = userRegex.exec(arg))) {
            const id = match[1];
            const user = guild.client.users.cache.get(id);
            if (user) users.set(id, user);
            const member = guild.members.cache.get(id);
            if (member) members.set(id, member);
        } else if ((match = roleRegex.exec(arg))) {
            const id = match[1];
            const role = guild.roles.cache.get(id);
            if (role) roles.set(id, role);
        } else if ((match = channelRegex.exec(arg))) {
            const id = match[1];
            const channel = guild.channels.cache.get(id);
            if (channel && channel.type !== dsc.ChannelType.PublicThread && channel.type !== dsc.ChannelType.PrivateThread) {
                channels.set(id, channel as dsc.GuildChannel);
            }
        }
    }
    return { users, roles, members, channels };
}