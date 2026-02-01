import { Action, AnyAction, PredefinedActionEventTypes, ActionCallback, ConstraintCallback, AnyEventCtx, ActionEventType } from '../index.js';
import { MessageEventCtx, UserEventCtx, VoiceChannelsEventCtx, ThreadEventCtx, ChannelEventCtx } from '../index.js';
import { PredefinedActionCallbacks, PredefinedActionConstraints } from '../index.js';
import { OnForceReloadTemplates } from '../../../events/actions/templatesEvents.js';

import actionsManager from '../index.js';

import { RenameableChannel } from '../../../defs.js';

import * as dsc from 'discord.js';
import { ChannelName, makeChannelName } from '@/util/makeChannelName.js';
import { client } from '@/client.js';

export async function getChannel(id: dsc.Snowflake, client: dsc.Client): Promise<dsc.Channel> {
    let channel = client.channels.cache.get(id);
    if (channel == null) {
        channel = await client.channels.fetch(id) ?? undefined;
    }

    return channel!;
}

export interface TemplateChannel {
    channel: RenameableChannel;
    updateOnEvents: ActionEventType[];
    format: (ctx: AnyEventCtx) => string | Promise<string>;

    additionalConstraints?: ConstraintCallback<ChannelEventCtx>[];
    additionalCallbacks?: ActionCallback<ChannelEventCtx>[];
}

export function mkTemplateChannelUpdateAction({ channel, updateOnEvents, format, additionalConstraints, additionalCallbacks }: TemplateChannel): AnyAction {
    return {
        activationEventType: updateOnEvents,
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
    }
}

export function addTemplateChannel(options: TemplateChannel) {
    actionsManager.addAction(mkTemplateChannelUpdateAction(options));
}