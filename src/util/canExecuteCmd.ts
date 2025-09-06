import { Command } from "../bot/command.js";

import * as dsc from 'discord.js';

export default function canExecuteCmd(cmd: Command, user: dsc.GuildMember) {
    if (cmd.permissions.allowedUsers == null) return true;
    if (cmd.permissions.allowedRoles == null) return true;

    for (const allowedRoleID of cmd.permissions.allowedRoles ?? []) {
        if (user.roles.cache.has(allowedRoleID)) return true;
    }

    for (const allowedUserID of cmd.permissions.allowedUsers ?? []) {
        if (user.id == allowedUserID) return true;
    }

    return false;
}