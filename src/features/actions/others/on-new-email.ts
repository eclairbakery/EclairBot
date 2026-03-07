import { ReceivedNewEmailEvent, ReceivedNewEmail } from '@/bot/apis/email/actions.js';
import { cfg } from '@/bot/cfg.js';
import { client } from '@/client.js';
import { Action } from '@/features/actions/index.js';
import { SendableChannel } from '@/defs.js';

import * as log from '@/util/log.js';
import { output } from '@/bot/logging.js';

export const onReceivedEmailAction: Action<ReceivedNewEmail> = {
    activationEventType: ReceivedNewEmailEvent,
    constraints: [],
    callbacks: [
        async (ctx) => {
            let msgContent: string = '';
            if (ctx.email.subject) {
                msgContent += `### ${ctx.email.subject}\n`;
            }
            if (ctx.email.text) {
                msgContent += ctx.email.text;
            }

            const emailChannel = await client.channels.fetch(cfg.features.email.listenerChannel);
            if (emailChannel == null || !emailChannel.isSendable()) return;

            log.sendInfo(emailChannel as SendableChannel, "Nowa wiadomość email!", msgContent);
        }
    ],
};
