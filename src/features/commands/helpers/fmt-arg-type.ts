import { CommandArgType } from '@/bot/command.ts';

export function formatArgType(argType: CommandArgType): string | undefined {
    switch (argType.base) {
    case 'union': {
        const names = [...new Set(argType.variants.map((t) => formatArgType(t)))].filter((n): n is string => !!n);
        const last = names.pop();
        if (names.length > 0) {
            return `${names.join(', ')} lub ${last}`;
        } else if (last) {
            return last;
        } else {
            return undefined;
        }
    }
    case 'enum': {
        const names = [...new Set(argType.options.map((t) => `**${t}**`))];
        const last = names.pop();
        if (names.length > 1) {
            return `${names.join(', ')} lub ${last}`;
        } else if (names.length == 1) {
            return last;
        } else {
            return undefined;
        }
    }

    case 'string':
        return 'tekstem';
    case 'code':
        return 'kodem';

    case 'int':
        return 'liczbą całkowitą';
    case 'float':
        return 'liczbą';
    case 'money':
        return 'kwotą';

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
}
