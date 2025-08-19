import { Action, ActionEventType, ActionCallback, ConstraintCallback } from '../actions.js';
import { MessageEventCtx, UserEventCtx, VoiceChannelsEventCtx, ThreadEventCtx, ChannelEventCtx } from '../actions.js';
import { PredefinedActionCallbacks, PredefinedActionConstraints } from '../actions.js';

import * as log from '../../util/log.js';
import * as dsc from 'discord.js';


export interface AutoReplyActivationOption {
    type: 'contains' | 'is-equal-to' | 'starts-with' | 'ends-with';
    keyword: string;
}

export interface AutoReplyOptions {
    activationOptions: AutoReplyActivationOption[];
    reply: string | dsc.MessagePayload | dsc.MessageReplyOptions;
    additionalConstraints?: ConstraintCallback<MessageEventCtx>[];
    additionalCallbacks?: ActionCallback<MessageEventCtx>[];
}

export interface LogEmbedAutoReplyOptions {
    activationOptions: AutoReplyActivationOption[];
    replyTitle: string;
    replyDesc: string;
    additionalConstraints?: ConstraintCallback<MessageEventCtx>[];
    additionalCallbacks?: ActionCallback<MessageEventCtx>[];
}

export function mkAutoreplyAction({ activationOptions, reply, additionalCallbacks, additionalConstraints }: AutoReplyOptions): Action<MessageEventCtx> {
    let constraints: ConstraintCallback<MessageEventCtx>[] = [];
    for (const opt of activationOptions) {
        switch (opt.type) {
        case 'contains':
            constraints.push(PredefinedActionConstraints.msgContains(opt.keyword));
            break;
        case 'is-equal-to':
            constraints.push(PredefinedActionConstraints.msgIsEqualTo(opt.keyword));
            break;
        case 'starts-with':
            constraints.push(PredefinedActionConstraints.msgStartsWith(opt.keyword));
            break;
        case 'ends-with':
            constraints.push(PredefinedActionConstraints.msgEndsWith(opt.keyword));
            break;
        default:
            throw new Error(`Unknown activation option type: ${opt.type}`);
        }
    }

    return {
        activationEventType: ActionEventType.OnMessageCreateOrEdit,
        constraints: [
            ...constraints,
            ...additionalConstraints || [],
        ],
        callbacks: [
            PredefinedActionCallbacks.reply(reply),
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