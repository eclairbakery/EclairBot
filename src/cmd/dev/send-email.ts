import { cfg } from "@/bot/cfg.js";
import { Command, CommandFlags } from "@/bot/command.js";

import * as email from '@/bot/apis/email/mail.js';

import User from '@/bot/apis/db/user.js';

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

        const invoker = api.executor;
        
        const COOLDOWN_MS = 10 * 60 * 1000;
        const check = await invoker.cooldowns.check('email', COOLDOWN_MS);

        if (!check.can) {
            return api.log.replyError(
                api, 'Spam check!',
                `Musisz poczekać jeszcze ${check.waitSec} sekund zanim wyślesz kolejnego emaila bo nie chcemy `
                   + `by nasz brand new mail stracił reputacje i trafial do spamu odrazu po uruchomieniu.`
            );
        }

        const now = Date.now();

        try {
            email.sendMessage({
                receiver: receiver,
                subject: 'Wiadomość od ' + api.invoker.user.displayName,
                content: contentArg,
            });

            await invoker.cooldowns.set('email', now);

            api.log.replySuccess(api, 'Udało się!', `Wysłalem emaila do ${receiver}!`);
        } catch (err) {
            api.log.replyError(api, 'Zjebało się!', `Jak zawsze coś się jebie z tym emailem wina tuska i tych calych internetów.\nerror: ${err}`);
        }
    }
};
