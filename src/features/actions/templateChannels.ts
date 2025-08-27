import { Action, AnyAction, PredefinedActionEventTypes, ActionCallback, ConstraintCallback, AnyEventCtx, ActionEventType } from '../actions.js';
import { MessageEventCtx, UserEventCtx, VoiceChannelsEventCtx, ThreadEventCtx, ChannelEventCtx } from '../actions.js';
import { PredefinedActionCallbacks, PredefinedActionConstraints } from '../actions.js';

import actionsManager from '../actions.js';

import { RenameableChannel } from '../../defs.js';

import * as dsc from 'discord.js';

export interface TemplateChannel {
    channel: RenameableChannel;
    updateOnEvents: ActionEventType[];
    format: (ctx: AnyEventCtx) => string | Promise<string>;

    additionalConstraints?: ConstraintCallback<ChannelEventCtx>[];
    additionalCallbacks?: ActionCallback<ChannelEventCtx>[];
}

export function* mkTemplateChannelUpdateActions({ channel, updateOnEvents, format, additionalConstraints, additionalCallbacks }: TemplateChannel): Iterable<AnyAction> {
    for (const event of updateOnEvents) {
        yield {
            activationEventType: event,
            constraints: [
                ...additionalConstraints || [],
            ],
            callbacks: [
                async (ctx: AnyEventCtx) => {
                    let newName: string | Promise<string> = format(ctx);
                    if (newName instanceof Promise) {
                        newName = await newName;
                    }
                    channel.setName(newName);
                },
                ...additionalCallbacks || [],
            ],
        };
    }
}

export function addTemplateChannel(options: TemplateChannel) {
    for (const action of mkTemplateChannelUpdateActions(options)) {
        actionsManager.addAction(action);
    }
}