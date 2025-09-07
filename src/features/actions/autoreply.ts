import { Action, PredefinedActionEventTypes, ActionCallback, ConstraintCallback, MagicSkipAllActions } from '../actions.js';
import { MessageEventCtx, UserEventCtx, VoiceChannelsEventCtx, ThreadEventCtx, ChannelEventCtx } from '../actions.js';
import { PredefinedActionCallbacks, PredefinedActionConstraints } from '../actions.js';

import * as log from '@/util/log.js';
import * as dsc from 'discord.js';


export interface AutoReplyActivationOption {
    type: 'contains' | 'is-equal-to' | 'starts-with' | 'ends-with' | 'matches-regex';
    keyword: string;
}

export type AutoReplyGetMessageCallback = (msg: dsc.Message) => (string | dsc.MessagePayload | dsc.MessageReplyOptions);

export interface AutoReplyOptions {
    activationOptions: AutoReplyActivationOption[];
    reply: (string | dsc.MessagePayload | dsc.MessageReplyOptions) | AutoReplyGetMessageCallback;
    additionalConstraints?: ConstraintCallback<MessageEventCtx>[];
    additionalCallbacks?: ActionCallback<MessageEventCtx>[];
    shallEndActionsLoop?: boolean
}

export interface LogEmbedAutoReplyOptions {
    activationOptions: AutoReplyActivationOption[];
    replyTitle: string;
    replyDesc: string;
    additionalConstraints?: ConstraintCallback<MessageEventCtx>[];
    additionalCallbacks?: ActionCallback<MessageEventCtx>[];
}

export function mkAutoreplyAction({ activationOptions, reply, additionalCallbacks, additionalConstraints, shallEndActionsLoop }: AutoReplyOptions): Action<MessageEventCtx> {
    let constraints: ConstraintCallback<MessageEventCtx>[] = [];
    for (const opt of activationOptions) {
        switch (opt.type) {
        case 'contains':
            constraints.push(PredefinedActionConstraints.msgContains(opt.keyword.toLowerCase()));
            break;
        case 'is-equal-to':
            constraints.push(PredefinedActionConstraints.msgIsEqualTo(opt.keyword.toLowerCase()));
            break;
        case 'starts-with':
            constraints.push(PredefinedActionConstraints.msgStartsWith(opt.keyword.toLowerCase()));
            break;
        case 'ends-with':
            constraints.push(PredefinedActionConstraints.msgEndsWith(opt.keyword.toLowerCase()));
            break;
        case 'matches-regex':
            constraints.push(PredefinedActionConstraints.msgMatchesRegex(opt.keyword.toLowerCase()));
            break;
        default:
            throw new Error(`Unknown activation option type: ${opt.type}`);
        }
    }

    return {
        activationEventType: PredefinedActionEventTypes.OnMessageCreateOrEdit,
        constraints: [
            PredefinedActionConstraints.or(...constraints),
            ...additionalConstraints || [],
        ],
        callbacks: [
            (msg) => {
                let replyValue: string | dsc.MessagePayload | dsc.MessageReplyOptions;
                if (typeof reply == 'function') {
                    replyValue = (reply as AutoReplyGetMessageCallback)(msg);
                } else {
                    replyValue = reply as (string | dsc.MessagePayload | dsc.MessageReplyOptions);
                }
                msg.reply(replyValue);
                if (shallEndActionsLoop) {
                    return MagicSkipAllActions;
                }
            },
            ...additionalCallbacks || [],
        ],
    };
}

export function mkAutoreplyErrorAction({ activationOptions, replyTitle, replyDesc, additionalCallbacks, additionalConstraints }: LogEmbedAutoReplyOptions): Action<MessageEventCtx> {
    return mkAutoreplyAction({
        activationOptions,
        reply: log.getErrorEmbed(replyTitle, replyDesc),
        additionalCallbacks,
        additionalConstraints,
    });
}

export function mkAutoreplyWarnAction({ activationOptions, replyTitle, replyDesc, additionalCallbacks, additionalConstraints }: LogEmbedAutoReplyOptions): Action<MessageEventCtx> {
    return mkAutoreplyAction({
        activationOptions,
        reply: log.getWarnEmbed(replyTitle, replyDesc),
        additionalCallbacks,
        additionalConstraints,
    });
}

export function mkAutoreplyInfoAction({ activationOptions, replyTitle, replyDesc, additionalCallbacks, additionalConstraints }: LogEmbedAutoReplyOptions): Action<MessageEventCtx> {
    return mkAutoreplyAction({
        activationOptions,
        reply: log.getInfoEmbed(replyTitle, replyDesc),
        additionalCallbacks,
        additionalConstraints,
    });
}

export function mkAutoreplySuccessAction({ activationOptions, replyTitle, replyDesc, additionalCallbacks, additionalConstraints }: LogEmbedAutoReplyOptions): Action<MessageEventCtx> {
    return mkAutoreplyAction({
        activationOptions,
        reply: log.getSuccessEmbed(replyTitle, replyDesc),
        additionalCallbacks,
        additionalConstraints,
    });
}

export function mkAutoreplyTipAction({ activationOptions, replyTitle, replyDesc, additionalCallbacks, additionalConstraints }: LogEmbedAutoReplyOptions): Action<MessageEventCtx> {
    return mkAutoreplyAction({
        activationOptions,
        reply: log.getTipEmbed(replyTitle, replyDesc),
        additionalCallbacks,
        additionalConstraints,
    });
}