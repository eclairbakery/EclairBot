import ban from '@/bot/apis/mod/bans.js';
import kick from '@/bot/apis/mod/kicks.js';
import mute from '@/bot/apis/mod/muting.js';

import { db } from '@/bot/apis/db/bot-db.js';
import { sendLog } from '@/bot/apis/log/send-log.js';

import { cfg } from '@/bot/cfg.js';
import { client } from '@/client.js';
import { OnWarnGiven, WarnEventCtx } from '@/events/actions/warnEvents.js';
import { Action } from '@/features/actions/index.js';
import { PredefinedColors } from '@/util/color.js';
import { Hour } from '@/util/parseTimestamp.js';

export const warnGivenLogAction: Action<WarnEventCtx> = {
    activationEventType: OnWarnGiven,
    constraints: [() => true],
    callbacks: [
        async (ctx) => {
            // logging
            sendLog({
                title: 'Użytkownik dostał warna',
                color: PredefinedColors.Orange,
                description: `Użytkownik <@${ctx.user.id}> dostał warna w wysokości ${ctx.points} pkt od ${ctx.moderator ? `moderatora <@${ctx.moderator}>` : 'nieznanego moderatora'}.`,
                fields: [
                    {
                        name: 'Powód',
                        value: ctx.reason
                    },
                    {
                        name: 'Wygasa',
                        value: ctx.expiresAt ? `<t:${ctx.expiresAt?.toString()}:R>` : 'nigdy'
                    }
                ]
            }, [cfg.channels.mod.warnings]);
        }
    ]
};
