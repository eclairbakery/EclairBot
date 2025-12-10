import cfg from "@/bot/cfg.js";
import { client } from "@/bot/client.js";
import User from "@/bot/db/user.js";
import { Snowflake } from "@/bot/defs/config.js";
import { output } from "@/bot/output.js";
import { mkProgressBar } from "@/utils/misc/progressBar.js";
import { findLowerClosestKey } from "@/utils/objects/findLowerClosestKey.js";
import * as dsc from 'discord.js';

export namespace leveling {
    const lvlRoles = Object.values(cfg.features.leveling.milestoneRoles);

    export function xpToLevel(xp: number, levelDivider: number = cfg.features.leveling.levelDivider): number {
        return Math.floor(
            (1 + Math.sqrt(1 + 8 * xp / levelDivider)) / 2
        );
    }

    export function levelToXp(level: number, levelDivider: number = cfg.features.leveling.levelDivider): number {
        return Math.floor((level * (level - 1) / 2) * levelDivider);
    }

    function getLevelingMention(user: dsc.User, ping: boolean = cfg.features.leveling.shallPingWhenNewLevel) {
        return ping ? `<@${user.id}>` : `**${user.displayName.replace('**', '\*\*')}**`;
    }

    function mkLvlProgressBar(xp: number, levelDivider: number, totalLength: number = 10): string {
        const level = xpToLevel(xp, levelDivider);
        const xpCurrentLevel = levelToXp(level, levelDivider);
        const xpNextLevel = levelToXp(level + 1, levelDivider);

        const progressXp = xp - xpCurrentLevel;
        const neededXp = xpNextLevel - xpCurrentLevel;

        return `${mkProgressBar(progressXp, neededXp, totalLength)} ${progressXp}/${neededXp}xp`;
    }

    async function addLvlRole(guild: dsc.Guild, newLevel: number, user: dsc.Snowflake) {
        const milestones = cfg.features.leveling.milestoneRoles || {};
        const milestoneRoleId: string | null = milestones[findLowerClosestKey(milestones, newLevel)] ?? null;
        if (milestoneRoleId != null) {
            let member: dsc.GuildMember;
            try {
                member = await guild.members.fetch(user);
            } catch (err) {
                output.warn(err);
                return milestoneRoleId;
            }
            if (member) {
                for (const roleId of lvlRoles) {
                    try {
                        if (member.roles.cache.has(roleId) && roleId !== milestoneRoleId) {
                            await member.roles.remove(roleId);
                        }
                    } catch (err) {
                        output.warn(`Failed to remove role ${roleId}:`, err);
                    }
                }
                try {
                    if (!member.roles.cache.has(milestoneRoleId)) await member.roles.add(milestoneRoleId);
                } catch (err: any) {
                    output.warn(err);
                }
            }
        }
        return milestoneRoleId;
    }

    export async function setLevel(amount: number, userId: Snowflake, changedByAndministrator: boolean) {
        const user = new User(userId);

        const prevXp = await user.leveling.getXP();
        const newXp = amount;
        const prevLevel = xpToLevel(prevXp, cfg.features.leveling.levelDivider);
        const newLevel = xpToLevel(newXp, cfg.features.leveling.levelDivider);

        await user.leveling.setXP(amount);

        if (newLevel > prevLevel) {
            let milestoneRoleId = await addLvlRole(client.guilds.cache.first()!, newLevel, userId);

            const channelLvl = await client.channels.fetch(cfg.features.leveling.levelChannel);
            if (!channelLvl || !channelLvl.isSendable()) return;

            const member = await client.guilds.cache.first()!.members.fetch(userId);
            const clientUser = await client.users.fetch(userId);

            let content: string;
            if (!changedByAndministrator) {
                content = `${getLevelingMention(clientUser)} wbił poziom ${newLevel}! Wow co za osiągnięcie!`;
                if (milestoneRoleId) content += 'I btw nową rolę zdobyłeś!';
            } else {
                if (newLevel > prevLevel) {
                    content = `Level użytkownika ${getLevelingMention(clientUser)} został zmieniony i teraz ma aż ${newLevel} level!`;
                    await addLvlRole(member.guild, newLevel, clientUser.id);
                } else if (newLevel < prevLevel) {
                    content = `Level użytkownika ${getLevelingMention(clientUser)} został zmieniony, przez co cofnął się do levela ${newLevel}!`;
                    await addLvlRole(member.guild, newLevel, clientUser.id);
                } else {
                    if (prevXp == newXp) {
                        content = `Administrator próbował zmienić level użytkownika ${getLevelingMention(clientUser)}, ale ma autyzm i ustawił dokladnie taki sam jaki był wcześniej czyli ${prevLevel} level. Nic tylko pogratulować`;
                    } else {
                        content = `Level użytkownika ${getLevelingMention(clientUser)} został zmieniony, co prawda dalej ma ${prevLevel} level, ale tym razem ${newXp}xp zamiast ${prevXp}xp?`
                            + ` Dobra przestane yappowac tych nerdowskich liczb i dam ci progress bar do następnego levela:` +
                            '\n' + mkLvlProgressBar(newXp, levelToXp(xpToLevel(newXp) + 1));
                    }
                }
            }
            channelLvl.send(content);
        }
    }
}