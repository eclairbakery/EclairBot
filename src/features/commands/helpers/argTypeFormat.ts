import { CommandArgType } from "@/bot/command.js";

export function formatArgType(argType: CommandArgType | CommandArgType[]): string | undefined {
    if (Array.isArray(argType)) {
        const names = [...new Set(argType.map(t => formatArgType(t)))];
        const last = names.pop();
        if (names.length > 1) {
            return `${names.join(', ')} lub ${last}`;
        } else if (names.length == 1) {
            return last;
        } else {
            return undefined;
        }
    }

    switch (argType.base) {
    case 'string':
        return 'tekstem';

    case 'int':
    case 'float':
        return 'liczbą';

    case 'timestamp':
        return 'znacznikiem czasu';

    case 'user-mention':
        return 'wzmianką użytkownika';

    case 'role-mention':
        return 'wzmianką roli';

    case 'channel-mention':
        return 'wzmianką kanału';
        
    case 'command-ref':
        return 'komendą';
    }
    return 'wartością';
}
