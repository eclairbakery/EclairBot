import * as log from '@/util/log.js';
import { ArgMustBeSomeTypeError, ArgParseError, MissingRequiredArgError } from '../defs/errors.js';
import { output } from '@/bot/logging.js';
import { formatArgType } from './argTypeFormat.js';

export function handleError(err: any, msg: log.Replyable) {
    if (err instanceof ArgParseError) {
        if (err instanceof MissingRequiredArgError) {
            return log.replyError(
                msg, 'Błąd!',
                `No ten, jest problem! Ta komenda **oczekiwała argumentu ${err.argName}** który powinien być ${formatArgType(err.argType)}`
                    + ` ale jesteś zbyt głupi i go **nie podałeś!**`,
            );
        } else if (err instanceof ArgMustBeSomeTypeError) {
            return log.replyError(
                msg, 'Błąd!',
                `No ten, jest problem! Ta komenda **oczekiwała argumentu ${err.argName}** który powinien być ${formatArgType(err.argType)}`
                    + ` ale oczywście jesteś pacanem i **nie podałeś oczekiwanego formatu!** Nic tylko gratulować.`,
            );
        }
    } else {
        if (err instanceof Error) {
            output.warn(err.stack ?? err.message);
        }
        return log.replyError(
            msg, 'Błąd!',
            `Wystąpił błąd podczas wykonywania komendy: \`${String(err).replace('`', '\`')}\`.`
                + ` To nie powinno się stać! Proszę o powiadomienie o tym właścicieli bota... a jak nie... ||To nic się nie stanie 🤗||`
        );
    }
}