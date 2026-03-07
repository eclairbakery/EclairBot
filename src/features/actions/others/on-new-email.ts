import { ReceivedNewEmailEvent, ReceivedNewEmail } from '@/bot/apis/email/actions.js';
import { cfg } from '@/bot/cfg.js';
import { client } from '@/client.js';
import { Action } from '@/features/actions/index.js';
import { sendLog } from '@/bot/apis/log/send-log.js';
import { db } from '@/bot/apis/db/bot-db.js';
import { AddressObject } from 'mailparser';

export const onReceivedEmailAction: Action<ReceivedNewEmail> = {
    activationEventType: ReceivedNewEmailEvent,
    constraints: [],
    callbacks: [
        async (ctx) => {
            const emailChannel = await client.channels.fetch(cfg.features.email.listenerChannel);
            if (emailChannel == null || !emailChannel.isSendable()) return;

            const sender = ctx.email.from?.value?.[0]?.address;
            const receiver = Array.isArray(ctx.email.to) // arrays have type object, so checking the type doesn't work 
                ? (ctx.email.to satisfies AddressObject[])?.[0]?.value?.[0]?.address
                : (ctx.email.to == undefined || ctx.email.to == null) // null is of type object btw 
                    ? undefined 
                    : ctx.email.to?.value?.[0]?.address; 

            const desc = `${(ctx.email.text ?? ctx.email.html) ?? 'Chłop nie wysłał nawet tekstu XD.' }`;

            const domain = sender?.split('@')[1]?.toLowerCase().trim() ?? 'hashcat.dev';

            if (domain) {
                db.runSql("INSERT OR IGNORE INTO email_security VALUES (NULL, ?);", [domain]);
            } 

            sendLog({
                where: cfg.channels.eclairbot.email,
                title: `📧 ${ctx.email.subject ?? 'Nowy e-mail'}`,
                description: 
                    desc.length > 1000 
                        ? desc.slice(0, 1000)
                        : desc,
                fields: [
                    {
                        name: 'Od',
                        value: sender ?? '<nieznany nadawca>'
                    },
                    {
                        name: 'Do',
                        value: receiver ?? process.env.EB_EMAIL_USER ?? '<nieznany odbiorca>' 
                    }
                ] 
            });
        }
    ],
};
