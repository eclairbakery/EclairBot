import { ConfigEconomyAction, ConfigEconomyCond } from "@/bot/definitions/config/economy.ts";
import { EconomyExecutor } from "./action.ts";

import Money from "@/util/money.ts";
import { Ternary } from "@/defs.ts";
import { cfg } from "@/bot/cfg.ts";

export interface EconomyActionsFormatterConfig {
    indentStep?: string;
    maxRandVariants?: number;
    zeroWidthSpace?: string;
    goodEmoji?: string;
    badEmoji?: string;
}

export interface EconomyActionsFormatter {
    format(actions: ConfigEconomyAction[]): string[];
}

export class MinimalActionsFormatter implements EconomyActionsFormatter {
    private ctx: EconomyExecutor;
    private config: Required<EconomyActionsFormatterConfig>;

    constructor(ctx: EconomyExecutor, config?: EconomyActionsFormatterConfig) {
        this.ctx = ctx;
        this.config = {
            ...{
                indentStep: "\u2002\u2002",
                maxRandVariants: 3,
                zeroWidthSpace: "\u200B",
                goodEmoji: "💸",
                badEmoji: "❗",
            },
            ...(config ?? {}),
        };
    }

    private formatCondition(cond: ConfigEconomyCond): string | null {
        switch (cond.op) {
            case "has-role":
                const role = this.ctx.getRoleById(cond.roleId);
                if (!role) return null;
                return `masz rolę <@&${role.discordRoleId}>`;

            case "has-item":
                const item = this.ctx.getItemById(cond.itemId);
                if (!item) return null;
                return `masz item **${item.name}**`;

            case "money-gte":
                const min = Money.fromDollarsFloat(cond.amount);
                return `masz przynajmniej ${min.format()}`;

            case "money-lte":
                const max = Money.fromDollarsFloat(cond.amount);
                return `masz poniżej ${max.format()}`;

            case "random-chance":
                return `tak się wylosuje **(${cond.chance}%)**`;
        }
    }

    private isGood(action: ConfigEconomyAction): Ternary {
        switch (action.op) {
            case "add-role":
            case "add-item":
            case "add-money":
                return true;

            case "rem-role":
            case "rem-item":
            case "sub-money":
                return false;

            default:
                return undefined;
        }
    }

    private formatActionSubject(action: ConfigEconomyAction): string | null {
        switch (action.op) {
            case "add-role":
            case "rem-role":
                const role = this.ctx.getRoleById(action.roleId);
                if (!role) break;
                return `${this.isGood(action) ? "rolę" : "**usunięcie** roli"} <@&${role.discordRoleId}>`;

            case "add-item":
            case "rem-item":
                const item = this.ctx.getItemById(action.itemId);
                if (!item) break;
                return `${this.isGood(action) ? "item" : "**usunięcie** itemu"} *${item.name}*`;

            case "add-money":
            case "sub-money":
                return `${this.isGood(action) ? "" : "**zabranie** "}` + Money.fromDollarsFloat(action.amount).format();
        }

        return null;
    }

    private formatRandom(action: ConfigEconomyAction & { op: "random" }, indent: string, header: string, allowExpansion: boolean): string[] {
        let result: string[] = [header];

        const sum = action.variants.reduce((acc, v) => acc + (v.weight ?? 1), 0);
        const variantsWithPercent = action.variants.map((v) => ({
            variant: v,
            percent: Math.round(((v.weight ?? 1) / sum) * 100),
        }));

        const sortedVariants = [...variantsWithPercent].sort((a, b) => b.percent - a.percent);
        const displayedVariants = this.config.maxRandVariants > 0 ? sortedVariants.slice(0, this.config.maxRandVariants) : sortedVariants;
        const hasMore = this.config.maxRandVariants > 0 && sortedVariants.length > this.config.maxRandVariants;

        for (const { variant, percent } of displayedVariants) {
            const nextIndent = indent + this.config.indentStep;
            const nextLinePrefix = this.config.zeroWidthSpace + nextIndent;

            if (variant.actions.length == 1) {
                const subAction = variant.actions[0];
                const subject = this.formatActionSubject(subAction);

                if (subAction.op == "random") {
                    result.push(...this.formatRandom(subAction, nextIndent, `${nextLinePrefix}**${percent}%** na losowo:`, allowExpansion));
                    continue;
                }

                if (subject) {
                    if (subAction.op == "add-item" && allowExpansion) {
                        const item = this.ctx.getItemById(subAction.itemId);
                        if (item && item.onUse && item.onUse.length > 0) {
                            if (item.onUse.length === 1 && item.onUse[0].op === "random") {
                                result.push(...this.formatRandom(item.onUse[0] as any, nextIndent, `${nextLinePrefix}**${percent}%** na ${subject} który losowo:`, false));
                                continue;
                            }
                            result.push(`${nextLinePrefix}**${percent}%** na ${subject} który:`);
                            result.push(...this.formatActionsList(item.onUse, nextIndent + this.config.indentStep, false));
                            continue;
                        }
                    }

                    const emoji = this.isGood(subAction) ? this.config.goodEmoji : this.config.badEmoji;
                    result.push(`${nextLinePrefix}${emoji} **${percent}%** na ${subject}`);
                    continue;
                }
            }

            result.push(`${nextLinePrefix}**${percent}%** na:`);
            result.push(...this.formatActionsList(variant.actions, nextIndent + this.config.indentStep, allowExpansion));
        }

        if (hasMore) {
            result.push(`${this.config.zeroWidthSpace}${indent + this.config.indentStep}... *użyj ${cfg.commands.prefix}iteminfo by zobaczyć pełną liste*`);
        }
        return result;
    }

    private formatActionsList(actions: ConfigEconomyAction[], indent: string, allowExpansion: boolean): string[] {
        let result: string[] = [];
        for (const action of actions) {
            const linePrefix = indent ? this.config.zeroWidthSpace + indent : "";

            switch (action.op) {
                case "add-role":
                case "add-item":
                case "add-money": {
                    const subject = this.formatActionSubject(action);
                    if (!subject) break;

                    if (action.op == "add-item" && allowExpansion) {
                        const item = this.ctx.getItemById(action.itemId);
                        if (item && item.onUse && item.onUse.length > 0) {
                            if (item.onUse.length === 1 && item.onUse[0].op === "random") {
                                result.push(...this.formatRandom(item.onUse[0] as any, indent, `${linePrefix}${this.config.goodEmoji} Daję ${subject} który losowo:`, false));
                                break;
                            }
                            result.push(`${linePrefix}${this.config.goodEmoji} Daję ${subject} który:`);
                            result.push(...this.formatActionsList(item.onUse, indent + this.config.indentStep, false));
                            break;
                        }
                    }
                    result.push(`${linePrefix}${this.config.goodEmoji} Daję ${subject}`);
                    break;
                }

                case "rem-role":
                case "rem-item":
                case "sub-money": {
                    const subject = this.formatActionSubject(action);
                    if (!subject) break;
                    result.push(`${linePrefix}${this.config.badEmoji} Zabiera ${subject}`);
                    break;
                }

                case "if":
                    result.push(`${linePrefix}**Jeżeli ${this.formatCondition(action.cond)} to:**`);
                    result.push(...this.formatActionsList(action.then, indent + this.config.indentStep, allowExpansion));
                    if (action.else) {
                        result.push(`${linePrefix}**W przeciwnym wypadku:**`);
                        result.push(...this.formatActionsList(action.else, indent + this.config.indentStep, allowExpansion));
                    }
                    break;
                case "while":
                    result.push(`${linePrefix}**Dopóki ${this.formatCondition(action.cond)} wykonuje:**`);
                    result.push(...this.formatActionsList(action.do, indent + this.config.indentStep, allowExpansion));
                    break;

                case "random": {
                    result.push(...this.formatRandom(action, indent, `${linePrefix}Daje losowo:`, allowExpansion));
                    break;
                }

                default:
                    break;
            }
        }
        return result;
    }

    format(actions: ConfigEconomyAction[]): string[] {
        return this.formatActionsList(actions, "", true);
    }
}
