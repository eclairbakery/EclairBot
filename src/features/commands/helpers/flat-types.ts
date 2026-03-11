import { CommandArgType } from "@/bot/command.js";

export function flatTypesToUnion(type: CommandArgType): CommandArgType[] {
    if (type.base == 'union') {
        let result: CommandArgType[] = [];
        for (const variant of type.variants) {
            result.push(...flatTypesToUnion(variant));
        }
        return result;
    }

    return [type];
}
