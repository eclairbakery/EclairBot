import { cfg } from "@/bot/cfg.js";
import { Command, CommandFlags } from "@/bot/command.js";

import * as email from '@/bot/apis/email/mail.js';

function parseEmailMessage(input: string): { subject: string, content: string } {
    let index = -1;

    for (let i = 0; i < input.length; i++) {
        if (input[i] == ":" && input[i - 1] != "\\") {
            index = i;
            break;
        }
    }

    if (index == -1) {
        return { subject: '', content: input.replace(/\\:/g, ":") };
    }

    let subject = input.slice(0, index);
    let content = input.slice(index + 1);

    subject = subject.replace(/\\:/g, ":").trim();
    content = content.replace(/\\:/g, ":").trim();

    return { subject, content };
}

export const sendEmailCmd: Command = {
    name: 'send-email',
    description: {
        main: 'Wysyła emaila do danego użytkownika z adresu eclairbota.',
        short: 'Wysyła email.'
    },
    aliases: ['email'],
    expectedArgs: [
        {
            name: 'receiver',
            description: 'Odbiorca twojego pięknego emaila',
            type: 'string',
            optional: false,
        },
        {
            name: 'content',
            description: 'Zawartość emaila',
            type: 'trailing-string',
            optional: false,
        }
    ],
    flags: CommandFlags.Important,
    permissions: {
        allowedRoles: cfg.devPerms.allowedRoles,
        allowedUsers: cfg.devPerms.allowedUsers,
    },
    
    async execute(api) {
        const receiver = api.getTypedArg('receiver', 'string')?.value!;
        const contentArg = api.getTypedArg('content', 'trailing-string')?.value!;

        const COOLDOWN_MS = 10 * 60 * 1000;
        const check = await api.executor.cooldowns.check('email', COOLDOWN_MS);

        if (!check.can) {
            return api.log.replyError(
                api, 'Spam check!',
                `Musisz poczekać jeszcze ${check.waitSec} sekund zanim wyślesz kolejnego emaila bo nie chcemy `
                   + `by nasz brand new mail stracił reputacje i trafial do spamu odrazu po uruchomieniu.`
            );
        }

        const now = Date.now();

        let msg = await api.log.replyTip(api, 'Wysyłanie... ', 'Poczekaj, to chwile potrwa!');

        try {
            let { subject, content } = parseEmailMessage(contentArg);
            if (subject == '') {
                subject = `Wiadomość od ${api.invoker.user.displayName}`;
            }
            if (content == '') {
                return msg.edit({
                    embeds: [api.log.getErrorEmbed('Błędna wiadomość', 'Nie możesz wysłać pustego emaila!')],
                });
            }

            await email.sendMessage({
                receiver: receiver,
                subject: subject,
                content: content,
            });

            await api.executor.cooldowns.set('email', now);

            msg.edit({
                embeds: [api.log.getSuccessEmbed('Udało się!', `Wysłalem emaila do ${receiver}!`)],
            });
        } catch (err) {
            msg.edit({
                embeds: [api.log.getErrorEmbed(
                    'Zjebało się!',
                    `Jak zawsze coś się jebie z tym emailem wina tuska i tych calych internetów.\nKod błędu: ${err}`
                )],
            });
        }
    }
};
