import { ReceivedNewEmailEvent, ReceivedNewEmail } from '@/bot/apis/email/actions.js';
import { cfg } from '@/bot/cfg.js';
import { client } from '@/client.js';
import { Action } from '@/features/actions/index.js';
import { sendLog } from '@/bot/apis/log/send-log.js';
import { db } from '@/bot/apis/db/bot-db.js';
import { AddressObject } from 'mailparser';
import { PredefinedColors } from '@/util/color.js';

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

            if (
                ctx.email.subject?.trim().toLowerCase() == 'delivery status notification (failure)'
            ) {
                const recipient = ctx.email.text?.match(/Final-Recipient:.*?;\s*(.+)/i)?.[1];

                let sentence = 'Ten... no nie powinno sie to stać.';

                const status = ctx.email.text?.match(/Status:\s*(.+)/i)?.[1]?.toLowerCase().trim();

                if (status?.startsWith('5.1.1')) {
                    sentence = 'Jakby coś, to po prostu ten mail nie istnieje.';
                } else if (status?.startsWith('5.2.1')) {
                    sentence = 'Teraz tu chodzi o to, że chyba ktoś wysłał do Epsteina maila, czy coś, bo skrzynka jest zablokowana u tej osoby chyba.';
                } else if (status?.startsWith('5.2.2')) {
                    sentence = 'Odbiorca maila nie zapłacił za abonament czy coś i skrzynkę ma pełną.';
                } else if (status?.startsWith('5.4.1')) {
                    sentence = 'Po prostu dzbaniany dostawca poczty, który nie ma nawet domeny lub nie istnieje.';
                } else if (status?.startsWith('4.')) {
                    sentence = 'Generalnie u osoby, która ma tą domenę, to coś się odpierdala, bo ma problem jakiś.';
                } else {
                    sentence = 'No nie wiem co to znaczy. W necie se wyszukaj.';
                } 

                return sendLog({
                    where: cfg.channels.eclairbot.email,
                    title: '😭 E-mail nie doszedł',
                    color: PredefinedColors.Red,
                    description: `Ktoś próbował wysłać maila do \`${recipient}\`, ale nie doszedł, ponieważ jakiś dzbaniany dostawca poczty zgłosił błąd \`${status}\`. ${sentence}`
                });
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
