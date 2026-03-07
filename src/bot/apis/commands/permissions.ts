import { cfg } from "@/bot/cfg.js";
import { Command } from "./cmd.js";

export namespace CommandPermissions {
    export function everyone(): Command['permissions'] {
        return {
            allowedRoles: null,
            allowedUsers: null,
        };
    }

    export function none(): Command['permissions'] {
        return {
            allowedRoles: [],
            allowedUsers: []
        }
    }

    export function devOnly(): Command['permissions'] {
        return {
            allowedRoles: [ ...cfg.devPerms.allowedRoles ],
            allowedUsers: [ ...cfg.devPerms.allowedUsers ]
        };
    }

    export function fromCommandConfig<T extends Command['permissions']>(cfg: T): Command['permissions'] {
        return {
            allowedRoles: cfg.allowedRoles,
            allowedUsers: cfg.allowedUsers
        };
    }
}
