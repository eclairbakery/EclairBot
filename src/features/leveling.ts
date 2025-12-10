import cfg from "@/bot/cfg.js";
import { client } from "@/bot/client.js";
import User from "@/bot/db/user.js";
import { Snowflake } from "@/bot/defs/config.js";
import { output } from "@/bot/output.js";
import { mkProgressBar } from "@/utils/misc/progressBar.js";
import { findLowerClosestKey } from "@/utils/objects/findLowerClosestKey.js";
import * as dsc from "discord.js";

export namespace leveling {
    const lvlRoles = Object.values(cfg.features.leveling.milestoneRoles);

    const xpToLevel = (xp: number, div: number = cfg.features.leveling.levelDivider): number => {
        return Math.floor((1 + Math.sqrt(1 + 8 * xp / div)) / 2);
    };

    const levelToXp = (level: number, div: number = cfg.features.leveling.levelDivider): number => {
        return Math.floor((level * (level - 1) / 2) * div);
    };

    const mention = (u: dsc.User, ping: boolean = cfg.features.leveling.shallPingWhenNewLevel) => {
        return ping ? `<@${u.id}>` : `**${u.displayName.replace("**", "\\*\\*")}`;
    };

    const renderProgress = (xp: number, div: number, len: number = 10) => {
        const level = xpToLevel(xp, div);
        const curr = levelToXp(level, div);
        const next = levelToXp(level + 1, div);
        const prog = xp - curr;
        const need = next - curr;
        return `${mkProgressBar(prog, need, len)} ${prog}/${need}xp`;
    };

    const addLvlRole = async (guild: dsc.Guild, lvl: number, uid: dsc.Snowflake) => {
        const milestones = cfg.features.leveling.milestoneRoles || {};
        const roleId: string | null = milestones[findLowerClosestKey(milestones, lvl)] ?? null;
        if (!roleId) return null;

        let m: dsc.GuildMember;
        try {
            m = await guild.members.fetch(uid);
        } catch (e) {
            output.warn(e);
            return roleId;
        }

        for (const r of lvlRoles) {
            try {
                if (m.roles.cache.has(r) && r !== roleId) await m.roles.remove(r);
            } catch (e) {
                output.warn(e);
            }
        }

        try {
            if (!m.roles.cache.has(roleId)) await m.roles.add(roleId);
        } catch (e) {
            output.warn(e);
        }

        return roleId;
    };

    const sendLevelMessage = async (
        member: dsc.GuildMember,
        newLevel: number,
        prevLevel: number,
        newXp: number,
        prevXp: number,
        changed: boolean,
        roleId: string | null
    ) => {
        const ch = await client.channels.fetch(cfg.features.leveling.levelChannel);
        if (!ch || !ch.isSendable()) return;

        const user = await client.users.fetch(member.id);

        if (!changed) {
            let txt = `${mention(user)} wbił poziom ${newLevel}! Wow co za osiągnięcie!`;
            if (roleId) txt += `I btw nową rolę zdobyłeś!`;
            ch.send(txt);
            return;
        }

        if (newLevel > prevLevel) {
            ch.send(`Level użytkownika ${mention(user)} został zmieniony i teraz ma aż ${newLevel} level!`);
            await addLvlRole(member.guild, newLevel, user.id);
            return;
        }

        if (newLevel < prevLevel) {
            ch.send(`Level użytkownika ${mention(user)} został zmieniony, przez co cofnął się do levela ${newLevel}!`);
            await addLvlRole(member.guild, newLevel, user.id);
            return;
        }

        if (prevXp === newXp) {
            ch.send(`Administrator próbował zmienić level użytkownika ${mention(user)}, ale ustawił dokładnie taki sam jaki był wcześniej czyli ${prevLevel} level. Nic tylko pogratulować`);
            return;
        }

        const bar = renderProgress(newXp, cfg.features.leveling.levelDivider);
        ch.send(`Level użytkownika ${mention(user)} został zmieniony. Dalej ma ${prevLevel} level, ale teraz ${newXp}xp zamiast ${prevXp}xp?\nDobra przestane yappowac tych nerdowskich liczb i dam ci progress bar do następnego levela:\n${bar}`);
    };

    const applyLevelSet = async (
        uid: Snowflake,
        newXp: number,
        changed: boolean
    ) => {
        const u = new User(uid);
        const prevXp = await u.leveling.getXP();
        const prevLvl = xpToLevel(prevXp);
        const newLvl = xpToLevel(newXp);

        await u.leveling.setXP(newXp);

        const g = client.guilds.cache.first()!;
        const m = await g.members.fetch(uid);

        let roleId: string | null = null;
        if (newLvl > prevLvl) roleId = await addLvlRole(g, newLvl, uid);

        if (newLvl !== prevLvl || changed) {
            await sendLevelMessage(m, newLvl, prevLvl, newXp, prevXp, changed, roleId);
        }
    };

    export const setLevel = async (xp: number, uid: Snowflake, changed: boolean) => {
        await applyLevelSet(uid, xp, changed);
    };

    export const addLevel = async (uid: Snowflake, delta: number, changed: boolean) => {
        const u = new User(uid);
        const current = await u.leveling.getXP();
        const lvl = xpToLevel(current);
        const target = lvl + delta;
        const xpNeeded = levelToXp(target);
        await applyLevelSet(uid, xpNeeded, changed);
    };

    export const removeLevel = async (uid: Snowflake, delta: number, changed: boolean) => {
        const u = new User(uid);
        const current = await u.leveling.getXP();
        const lvl = xpToLevel(current);
        const target = Math.max(1, lvl - delta);
        const xpNeeded = levelToXp(target);
        await applyLevelSet(uid, xpNeeded, changed);
    };
}