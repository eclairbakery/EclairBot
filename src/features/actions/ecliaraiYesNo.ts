import { Action, ActionEventType, ActionCallback, ConstraintCallback } from '../actions.js';
import { MessageEventCtx, UserEventCtx, VoiceChannelsEventCtx, ThreadEventCtx, ChannelEventCtx } from '../actions.js';
import { PredefinedActionCallbacks, PredefinedActionConstraints } from '../actions.js';

export const eclairAIYesNoAction: Action<MessageEventCtx> = {
    activationEventType: ActionEventType.OnMessageCreateOrEdit,
    constraints: [
        (msg) => msg.content.toLowerCase().startsWith(`<@${msg.client.user?.id}> czy`),
    ],
    callbacks: [
        (msg) => {
            const responses = ['tak', 'nie', 'idk', 'kto wie', 'raczej nie', 'niezbyt', 'raczej tak', 'definitynie NIE', 'definitywnie TAK', 'TAK!', 'NIE!', 'zaprzeczam', 'potwierdzam', 'nie chce mi sie tego osądzać'];
            const response: string = (msg.content.toLowerCase().includes('windows jest lepszy od linux') || msg.content.toLowerCase().includes('windows jest lepszy niz linux') || msg.content.toLowerCase().includes('windows jest lepszy niż linux')) ? 'NIE' : ((msg.content.toLowerCase().includes('linux jest lepszy od windows') || msg.content.toLowerCase().includes('linux jest lepszy niz windows') || msg.content.toLowerCase().includes('linux jest lepszy niż windows')) ? 'TAK' : (responses[Math.floor(Math.random() * responses.length)]));
            return msg.reply(response);
        }
    ]
};