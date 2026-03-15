import { CommandArgType } from '@/bot/command.ts';

export function flatTypesToUnion(type: CommandArgType): CommandArgType[] {
    if (type.base == 'union') {
        const result: CommandArgType[] = [];
        for (const variant of type.variants) {
            result.push(...flatTypesToUnion(variant));
        }
        return result;
    }

    return [type];
}
