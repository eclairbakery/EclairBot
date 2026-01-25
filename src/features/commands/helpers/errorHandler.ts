import * as log from '@/util/log.js';
import { ArgMustBeSomeTypeError, ArgParseError, MissingRequiredArgError } from '../defs/errors.js';
import { output } from '@/bot/logging.js';
import { formatArgType } from './argTypeFormat.js';
import { DiscordAPIError } from 'discord.js';

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
        } else {
            return log.replyError(
                msg, 'Błąd',
                'Właściwie to nie wiem co się stało :wilted-rose:'
            );
        }
    } else {
        if (err instanceof Error) {
            output.warn(err.stack ?? err.message);

            if (err instanceof DiscordAPIError) {
                if (
                    err.message.includes('BASE_TYPE_MAX_LENGTH') ||
                    err.message.includes('MAX_EMBED_SIZE_EXCEEDED')
                ) {
                    return log.replyError(
                        msg, 'Błąd!',
                        'Niestety wystąpił problem dotyczący długości wiadomości. Prawdopodobnie twoja komenda zrobiła coś, że output wyszedł za długi dla Discorda.'
                    );
                } else if (err.code == 50013 || err.code == 50001) {
                    return log.replyError(
                        msg, 'Błąd!',
                        'Coś jest prawdopodobnie namieszane z permisjami. Skontaktuj się z administracją serwera.'
                    );
                } else if (err.code == 10008) {
                    return log.replyError(
                        msg, 'Błąd!',
                        'Komenda próbuje operować na wiadomości, której nie ma lub została usunięta.'
                    );
                }
            }
        }

        return log.replyError(
            msg, 'Błąd!',
            `Wystąpił błąd podczas wykonywania komendy: \`${String(err).replaceAll('`', '\`')}\`.`
                + ` To nie powinno się stać! Proszę o powiadomienie o tym właścicieli bota... a jak nie... ||To nic się nie stanie 🤗||`
        );
    }
}