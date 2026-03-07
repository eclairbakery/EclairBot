import { ReceivedNewEmailEvent, ReceivedNewEmail } from '@/bot/apis/email/actions.js';
import { cfg } from '@/bot/cfg.js';
import { client } from '@/client.js';
import { Action } from '@/features/actions/index.js';
import { sendLog } from '@/bot/apis/log/send-log.js';
import { db } from '@/bot/apis/db/bot-db.js';

export const onReceivedEmailAction: Action<ReceivedNewEmail> = {
    activationEventType: ReceivedNewEmailEvent,
    constraints: [],
    callbacks: [
        async (ctx) => {
            const emailChannel = await client.channels.fetch(cfg.features.email.listenerChannel);
            if (emailChannel == null || !emailChannel.isSendable()) return;

            const sender = ctx.email.from?.value?.[0]?.address;

            const desc = `${(sender ?? 'ktoś tam').slice(0, 250)} wysłał: ${(ctx.email.text ?? ctx.email.html) ?? 'Chłop nie wysłał nawet tekstu XD.' }`;

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
                        : desc
            });
        }
    ],
};
