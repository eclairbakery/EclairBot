import { sendLog } from '@/bot/apis/log/send-log.ts';
import { PredefinedColors } from '@/util/color.ts';
import { MessageEventCtx, PredefinedActionEventTypes } from '../index.ts';

import { Action } from '../index.ts';
import { cfg } from '@/bot/cfg.ts';
import { output } from '../../../bot/logging.ts';

const enabled = Deno.env.get('EB_AUTO_UPDATE') == 'true';

export const autoUpdateAction: Action<MessageEventCtx> = {
    name: 'others/auto-update',
    activatesOn: [PredefinedActionEventTypes.OnMessageCreate],

    constraints: [
        (ctx) => ctx.channelId == cfg.channels.eclairbot.ghBridge,
        (___) => enabled,
    ],

    callbacks: [
        async (_) => {
            const cmd = new Deno.Command('git', {
                args: ['pull'],
            });
            const out = await cmd.output();

            output.log('executing fucking auto update action');

            if (out.code != 0) {
                return sendLog({
                    title: 'Auto update failed',
                    description: 'Git się wyjebal czy coś',
                    fields: [
                        { name: 'Exit Code', value: `${out.code}` },
                        { name: 'Std Error', value: new TextDecoder().decode(out.stderr) },
                    ],
                    color: PredefinedColors.Red,
                });
            }

            sendLog({
                title: 'Auto update succeeded',
                description: 'Auto update się wykonał czy coś.',
                color: PredefinedColors.Gold,
            });
            Deno.exit(1);
        },
    ],
};

