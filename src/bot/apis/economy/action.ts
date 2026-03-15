import {
    ConfigEconomyCond, ConfigEconomyAction, ConfigEconomyRandomVariant,
    ConfigEconomyMultiplierKind, ConfigEconomyRole
} from '@/bot/definitions/config/economy.ts';
import { cfg } from '@/bot/cfg.ts';

import * as dsc from 'discord.js';

import User from '@/bot/apis/db/user.ts';
import Money from '@/util/money.ts';

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

    getMemberRoles(): ConfigEconomyRole[] {
        if (!this.ctx.member) return [];
        return cfg.features.economy.roles.filter(r => this.ctx.member!.roles.cache.has(r.discordRoleId));
    }

    getMultiplier(kind: ConfigEconomyMultiplierKind): number {
        const roles = this.getMemberRoles();
        let total = 1.0;
        for (const role of roles) {
            for (const m of role.benefits.multipliers) {
                const matches = m.filter == '*' || (Array.isArray(m.filter) && m.filter.includes(kind));
                if (matches) total *= m.multiplier;
            }
        }
        return total;
    }

    getDailyIncomeActions(): ConfigEconomyAction[] {
        return this.getMemberRoles().flatMap(r => r.benefits.dailyIncome);
    }
    async applyDailyIncome() {
        await this.executeActions(this.getDailyIncomeActions());
    }

    async executeActions(actions: ConfigEconomyAction[]): Promise<ConfigEconomyAction[]> {
        const expanded = await this.expandActions(actions);
        for (const action of expanded) {
            await this.executeLeafAction(action);
        }
        return expanded;
    }

    async expandActions(actions: ConfigEconomyAction[]): Promise<ConfigEconomyAction[]> {
        const res: ConfigEconomyAction[] = [];
        for (const action of actions) {
            switch (action.op) {
            case 'if': {
                if (await this.checkCondition(action.cond)) {
                    res.push(...await this.expandActions(action.then));
                } else if (action.else) {
                    res.push(...await this.expandActions(action.else));
                }
                break;
            }
            case 'random': {
                res.push(...await this.expandRandom(action.variants));
                break;
            }
            case 'while': {
                let iterations = 0;
                const max = action.maxIterations ?? 100;
                while (await this.checkCondition(action.cond) && iterations < max) {
                    res.push(...await this.expandActions(action.do));
                    iterations++;
                }
                break;
            }

            case 'add-role': {
                const role = this.getRoleById(action.roleId);
                if (!role) break;
                if (this.hasRole(role.id)) {
                    res.push({ op: 'add-money', amount: role.refund });
                    break;
                }
                res.push(action);
                break;
            }
            case 'rem-role': {
                const role = this.getRoleById(action.roleId);
                if (!this.hasRole(role!.id)) {
                    res.push({ op: 'sub-money', amount: role!.refund });
                    break;
                }
                res.push(action);
                break;
            }

            default:
                res.push(action);
                break;
            }
        }
        return res;
    }

    private async executeLeafAction(action: ConfigEconomyAction) {
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
            await this.ctx.user.economy.addWalletMoney(Money.fromDollarsFloat(action.amount));
            break;
        case 'sub-money':
            await this.ctx.user.economy.deductWalletMoney(Money.fromDollarsFloat(action.amount));
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
            return balGte.wallet.greaterThanOrEqual(Money.fromDollarsFloat(cond.amount));
        case 'money-lte':
            const balLte = await this.ctx.user.economy.getBalance();
            return balLte.wallet.lessThanOrEqual(Money.fromDollarsFloat(cond.amount));
        case 'random-chance':
            return Math.random() * 100 <= cond.chance;
        }
    }

    private async expandRandom(variants: ConfigEconomyRandomVariant[]): Promise<ConfigEconomyAction[]> {
        if (variants.length == 0) return [];
        
        const totalWeight = variants.reduce((acc, v) => acc + (v.weight ?? 1), 0);
        let rand = Math.random() * totalWeight;

        for (const variant of variants) {
            const weight = variant.weight ?? 1;
            if (rand < weight) {
                return await this.expandActions(variant.actions);
            }
            rand -= weight;
        }
        return [];
    }

    private hasRole(roleConfigId: string): boolean {
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
