import * as log from '@/util/log.ts';
import { ArgMustBeSomeTypeError, ArgParseError, ArgViolatesRules, MissingRequiredArgError } from '../defs/errors.ts';
import { formatArgType } from './fmt-arg-type.ts';
import { DiscordAPIError } from 'discord.js';
import { CommandViolatedRule } from '@/bot/command.ts';
import logError from '@/util/log-error.ts';

function handleViolatedRule(v: CommandViolatedRule) {
    switch (v) {
        case 'used-infinity':
            return 'podał nieskończonność jako argument';
        case 'non-int-passed':
            return 'podał coś co nie jest intem (a miało być) jako argument';
    }
}

export function handleError(err: Error | unknown, msg: log.Replyable) {
    if (err instanceof ArgParseError) {
        if (err instanceof MissingRequiredArgError) {
            return log.replyError(
                msg,
                'Błąd!',
                `No ten, jest problem! Ta komenda **oczekiwała argumentu ${err.argName}** który powinien być ${formatArgType(err.argType)}` +
                    ` ale jesteś zbyt głupi i go **nie podałeś!**`,
            );
        } else if (err instanceof ArgMustBeSomeTypeError) {
            return log.replyError(
                msg,
                'Błąd!',
                `No ten, jest problem! Ta komenda **oczekiwała argumentu ${err.argName}** który powinien być ${formatArgType(err.argType)}` +
                    ` ale oczywście jesteś pacanem i **nie podałeś oczekiwanego formatu!** Nic tylko gratulować.`,
            );
        } else if (err instanceof ArgViolatesRules) {
            return log.replyError(
                msg,
                'Błąd',
                `No ten, jest problem! Ta komenda **oczekiwała argumentu ${err.argName}** który powinien być ${formatArgType(err.argType)}` +
                    ` ale oczywście jesteś pacanem, który nadużył mojego zaufania i **${handleViolatedRule(err.violatedRules)}**!`,
            );
        } else {
            return log.replyError(
                msg,
                'Błąd',
                'Właściwie to nie wiem co się stało :wilted-rose:',
            );
        }
    } else {
        if (err instanceof Error) {
            if (err instanceof DiscordAPIError) {
                if (
                    err.message.includes('BASE_TYPE_MAX_LENGTH') ||
                    err.message.includes('MAX_EMBED_SIZE_EXCEEDED')
                ) {
                    return log.replyError(
                        msg,
                        'Błąd!',
                        'Niestety wystąpił problem dotyczący długości wiadomości. Prawdopodobnie twoja komenda zrobiła coś, że output wyszedł za długi dla Discorda.',
                    );
                } else if (
                    err.message.includes('NUMBER_TYPE_COERCE')
                ) {
                    return log.replyError(
                        msg,
                        'Błąd!',
                        'Discord nie przyjmuje az tak dużych liczb. Raczej nie wie, że istnieje coś takiego jak typ `bigint`.',
                    );
                } else if (err.code == 50013 || err.code == 50001) {
                    return log.replyError(
                        msg,
                        'Błąd!',
                        'Coś jest prawdopodobnie namieszane z permisjami. Skontaktuj się z administracją serwera.',
                    );
                } else if (err.code == 10008) {
                    return log.replyError(
                        msg,
                        'Błąd!',
                        'Komenda próbuje operować na wiadomości, której nie ma lub została usunięta.',
                    );
                }
            } else if (err.message.includes('fetch failed')) {
                return log.replyError(msg, 'Błąd', 'Ktoś wyłączył internet w bocie. Nie zważał na potrzeby rozwijania się istoty wyższej. Proszę natychmiast wyłączyć ten firewall lub dać mi internet access w trybie natychmiastowym.');
            }

            logError('stderr', err, 'Command event handler');
        }

        return log.replyError(
            msg,
            'Błąd!',
            `Wystąpił błąd podczas wykonywania komendy: \`${String(err).replaceAll('\n', '').replaceAll('`', '\`')}\`.` +
                `\n**To nie powinno się stać!** Proszę o powiadomienie o tym administracji serwera`,
        );
    }
}
