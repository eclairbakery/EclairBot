import { CommandArgType } from "@/bot/command.js";

export function formatArgType(argType: CommandArgType) {
    switch (argType) {
    case 'string':
    case 'trailing-string':
        return 'tekstem';

    case 'number':
        return 'liczbą';

    case 'timestamp':
        return 'znacznikiem czasu';

    case 'user-mention':
    case 'user-mention-or-reference-msg-author':
        return 'wzmianką użytkownika';

    case 'role-mention':
        return 'wzmianką roli';

    case 'channel-mention':
        return 'wzmianką kanału';
    }
}