import { Action, MagicSkipAllActions, MessageEventCtx, PredefinedActionEventTypes } from '@/features/actions/index.ts';
import { cfg } from '@/bot/cfg.ts';
import handleBashCode from '@/bot/apis/bash-simulator/shell.ts';

export const bashSimulationAction: Action<MessageEventCtx> = {
    name: '4fun/bash-simulation',
    activatesOn: [ PredefinedActionEventTypes.OnMessageCreate ],
    
    constraints: [ 
        (ctx) => ctx.channel.id == cfg.channels.general.bash,  
        (ctx) => ctx.client.user.id !== ctx.author.id
    ],
    callbacks: [
        (msg) => {
            handleBashCode({
                script: msg.content,
                console: {
                    stdout (m) {
                        if (!m) return;
                        if (msg.channel.isSendable()) msg.channel.send(`🟦 stdout: \`${m.replaceAll('`', '\'')}\``);
                    },
                    stderr (m) {
                        if (!m) return;
                        if (msg.channel.isSendable()) msg.channel.send(`🟥 stderr: \`${m.replaceAll('`', '\'')}\``);
                    },
                    statusCode(status) {
                        if (msg.channel.isSendable()) msg.channel.send(`-# command exited with status ${status}`); 
                    },
                }
            }); 

            return MagicSkipAllActions;
        }
    ]
};
