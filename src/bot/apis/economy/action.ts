import {
    ConfigEconomyCond, ConfigEconomyAction, ConfigEconomyRandomVariant
} from '@/bot/definitions/economy.js';
import User from '@/bot/apis/db/user.js';
import { cfg } from '@/bot/cfg.js';
import * as dsc from 'discord.js';

export interface EconomyExecutorContext {
    user: User;
    member?: dsc.GuildMember;
}

export class EconomyExecutor {
    constructor(private ctx: EconomyExecutorContext) {}

    getRoleById(id: string)  { return cfg.features.economy.roles.find(r => r.id == id);  }
    getItemById(id: string)  { return cfg.features.economy.items.find(i => i.id == id);  }
    getOfferById(id: string) { return cfg.features.economy.offers.find(o => o.id == id); }

    private getByName<T extends { name: string, id: string }>(name: string, arr: T[]): T | undefined {
        const nameNormalized = name.trim().toLowerCase();
        for (const elem of arr) {
            const normalized = elem.name.trim().toLowerCase();
            if (nameNormalized == normalized) return elem;
            if (nameNormalized == elem.id) return elem;
        }
        return undefined;
    }

    getRoleByName(name: string)  { return this.getByName(name, cfg.features.economy.roles);  }
    getItemByName(name: string)  { return this.getByName(name, cfg.features.economy.items);  }
    getOfferByName(name: string) { return this.getByName(name, cfg.features.economy.offers); }

    async executeActions(actions: ConfigEconomyAction[]) {
        for (const action of actions) {
            await this.executeAction(action);
        }
    }

    private async executeAction(action: ConfigEconomyAction) {
        switch (action.op) {
        case 'add-item':
            await this.ctx.user.inventory.addItem(action.itemId);
            break;
        case 'rem-item':
            await this.ctx.user.inventory.removeItem(action.itemId);
            break;
        case 'add-role':
            await this.addRole(action.roleId);
            break;
        case 'rem-role':
            await this.remRole(action.roleId);
            break;
        case 'add-money':
            await this.ctx.user.economy.addWalletMoney(action.amount);
            break;
        case 'sub-money':
            await this.ctx.user.economy.deductWalletMoney(action.amount);
            break;
        case 'random':
            await this.executeRandom(action.variants);
            break;
        case 'if':
            if (await this.checkCondition(action.cond)) {
                await this.executeActions(action.then);
            } else if (action.else) {
                await this.executeActions(action.else);
            }
            break;
        case 'while':
            let iterations = 0;
            const max = action.maxIterations ?? 100;
            while (await this.checkCondition(action.cond) && iterations < max) {
                await this.executeActions(action.do);
                iterations++;
            }
            break;
        }
    }

    private async checkCondition(cond: ConfigEconomyCond): Promise<boolean> {
        switch (cond.op) {
        case 'has-role':
            return this.hasRole(cond.roleId);
        case 'has-item':
            return await this.ctx.user.inventory.hasItem(cond.itemId);
        case 'money-gte':
            const balGte = await this.ctx.user.economy.getBalance();
            return balGte.wallet >= cond.amount;
        case 'money-lte':
            const balLte = await this.ctx.user.economy.getBalance();
            return balLte.wallet <= cond.amount;
        case 'random-chance':
            return Math.random() * 100 <= cond.chance;
        }
    }

    private async executeRandom(variants: ConfigEconomyRandomVariant[]) {
        const totalWeight = variants.reduce((acc, v) => acc + (v.weight ?? 1), 0);
        let rand = Math.random() * totalWeight;

        for (const variant of variants) {
            const weight = variant.weight ?? 1;
            if (rand < weight) {
                await this.executeActions(variant.actions);
                return;
            }
            rand -= weight;
        }
    }

    private async hasRole(roleConfigId: string): Promise<boolean> {
        if (!this.ctx.member) return false;
        const roleConfig = this.getRoleById(roleConfigId);
        if (!roleConfig) return false;
        return this.ctx.member.roles.cache.has(roleConfig.discordRoleId);
    }

    private async addRole(roleConfigId: string) {
        if (!this.ctx.member) return;
        const roleConfig = this.getRoleById(roleConfigId);
        if (!roleConfig) return;
        await this.ctx.member.roles.add(roleConfig.discordRoleId).catch(() => {});
    }

    private async remRole(roleConfigId: string) {
        if (!this.ctx.member) return;
        const roleConfig = this.getRoleById(roleConfigId);
        if (!roleConfig) return;
        await this.ctx.member.roles.remove(roleConfig.discordRoleId).catch(() => {});
    }
}
